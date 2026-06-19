import { routeAI } from './router';
import { AdminConfig } from '../types';

export interface PipelineStep<TContext> {
  name: string;
  taskType: 'reasoning' | 'fast_action' | 'planning' | 'extraction';
  systemInstruction: string;
  prompt: (context: TContext) => string;
}

/**
 * The core invisible orchestration engine.
 * Chains multiple LLM calls across providers without exposing the complexity to the user.
 */
export class AgentPipeline<TContext extends Record<string, any>> {
  private steps: PipelineStep<TContext>[] = [];

  addStep(step: PipelineStep<TContext>) {
    this.steps.push(step);
    return this;
  }

  async execute(
    initialContext: TContext,
    settings: AdminConfig,
    secrets: { gemini?: string | null; nvidia?: string | null },
    onProgress?: (stepName: string) => void
  ): Promise<TContext> {
    const context = { ...initialContext };

    for (const step of this.steps) {
      if (onProgress) onProgress(step.name);

      const promptText = step.prompt(context);

      const out = await routeAI(
        {
          taskType: step.taskType,
          systemInstruction: step.systemInstruction,
          messages: [{ role: 'user', content: promptText }]
        },
        { 
          gemini: settings.routing_weight_gemini ?? 0.5, 
          nvidia: settings.routing_weight_nvidia ?? 0.5 
        },
        secrets
      );

      // Save the output of this step back into the context under the step's name
      (context as any)[step.name] = out.result;
    }

    return context;
  }
}
