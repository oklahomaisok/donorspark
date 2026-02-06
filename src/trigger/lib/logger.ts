/**
 * Structured logger for deck generation pipeline
 *
 * Outputs JSON logs that are easy to search and filter in Trigger.dev dashboard
 */

export interface StepResult {
  step: string;
  status: 'success' | 'warning' | 'error';
  duration: number;
  data?: Record<string, unknown>;
  error?: string;
}

export interface PipelineLog {
  deckSlug: string;
  url: string;
  steps: StepResult[];
  totalDuration: number;
  status: 'success' | 'failed';
  error?: string;
  summary: {
    orgName?: string;
    logoSource?: string;
    logoFound: boolean;
    metricsFound: number;
    sector?: string;
  };
}

export class PipelineLogger {
  private deckSlug: string;
  private url: string;
  private steps: StepResult[] = [];
  private startTime: number;
  private currentStep: { name: string; start: number } | null = null;

  constructor(deckSlug: string, url: string) {
    this.deckSlug = deckSlug;
    this.url = url;
    this.startTime = Date.now();
    this.log('pipeline_start', { deckSlug, url });
  }

  /**
   * Start timing a step
   */
  startStep(step: string): void {
    if (this.currentStep) {
      // Auto-end previous step if not ended
      this.endStep('warning', { note: 'Step ended implicitly' });
    }
    this.currentStep = { name: step, start: Date.now() };
    this.log('step_start', { step });
  }

  /**
   * End current step with result
   */
  endStep(
    status: 'success' | 'warning' | 'error',
    data?: Record<string, unknown>,
    error?: string
  ): StepResult | null {
    if (!this.currentStep) {
      console.warn('endStep called without active step');
      return null;
    }

    const duration = Date.now() - this.currentStep.start;
    const result: StepResult = {
      step: this.currentStep.name,
      status,
      duration,
      data,
      error,
    };

    this.steps.push(result);
    this.log('step_end', {
      step: this.currentStep.name,
      status,
      durationMs: duration,
      durationSec: (duration / 1000).toFixed(1),
      ...data,
      ...(error ? { error } : {}),
    });

    this.currentStep = null;
    return result;
  }

  /**
   * Log a step that runs synchronously or when you want manual control
   */
  logStep(
    step: string,
    status: 'success' | 'warning' | 'error',
    durationMs: number,
    data?: Record<string, unknown>,
    error?: string
  ): StepResult {
    const result: StepResult = {
      step,
      status,
      duration: durationMs,
      data,
      error,
    };
    this.steps.push(result);
    this.log('step_complete', {
      step,
      status,
      durationMs,
      durationSec: (durationMs / 1000).toFixed(1),
      ...data,
      ...(error ? { error } : {}),
    });
    return result;
  }

  /**
   * Finalize and output summary
   */
  finalize(
    status: 'success' | 'failed',
    summary: PipelineLog['summary'],
    error?: string
  ): PipelineLog {
    const totalDuration = Date.now() - this.startTime;

    const pipelineLog: PipelineLog = {
      deckSlug: this.deckSlug,
      url: this.url,
      steps: this.steps,
      totalDuration,
      status,
      error,
      summary,
    };

    // Output final summary
    this.log('pipeline_complete', {
      status,
      totalDurationMs: totalDuration,
      totalDurationSec: (totalDuration / 1000).toFixed(1),
      stepsCompleted: this.steps.length,
      stepsFailed: this.steps.filter(s => s.status === 'error').length,
      stepsWarning: this.steps.filter(s => s.status === 'warning').length,
      ...summary,
      ...(error ? { error } : {}),
    });

    // Output timing breakdown
    console.log('\n📊 PIPELINE SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Deck: ${this.deckSlug}`);
    console.log(`URL: ${this.url}`);
    console.log(`Status: ${status.toUpperCase()}`);
    console.log(`Total: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log('─'.repeat(50));

    for (const step of this.steps) {
      const icon = step.status === 'success' ? '✓' : step.status === 'warning' ? '⚠' : '✗';
      const time = `${(step.duration / 1000).toFixed(1)}s`.padStart(6);
      const dataStr = step.data ? ` → ${JSON.stringify(step.data)}` : '';
      console.log(`${icon} ${time} │ ${step.step}${dataStr}`);
    }

    console.log('═'.repeat(50));
    if (summary.orgName) console.log(`Org: ${summary.orgName}`);
    if (summary.logoSource) console.log(`Logo: ${summary.logoSource} (found: ${summary.logoFound})`);
    if (summary.metricsFound) console.log(`Metrics: ${summary.metricsFound} found`);
    if (summary.sector) console.log(`Sector: ${summary.sector}`);
    console.log('═'.repeat(50) + '\n');

    return pipelineLog;
  }

  /**
   * Internal structured log output
   */
  private log(event: string, data: Record<string, unknown>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      deckSlug: this.deckSlug,
      ...data,
    };
    console.log(`[PIPELINE] ${JSON.stringify(logEntry)}`);
  }
}

/**
 * Helper to run a step with automatic timing and error handling
 */
export async function runStep<T>(
  logger: PipelineLogger,
  stepName: string,
  fn: () => Promise<T>,
  extractData?: (result: T) => Record<string, unknown>
): Promise<T> {
  logger.startStep(stepName);
  try {
    const result = await fn();
    const data = extractData ? extractData(result) : undefined;
    logger.endStep('success', data);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.endStep('error', undefined, message);
    throw error;
  }
}

/**
 * Helper to run a step that might partially fail but shouldn't stop the pipeline
 */
export async function runStepSafe<T>(
  logger: PipelineLogger,
  stepName: string,
  fn: () => Promise<T>,
  defaultValue: T,
  extractData?: (result: T) => Record<string, unknown>
): Promise<T> {
  logger.startStep(stepName);
  try {
    const result = await fn();
    const data = extractData ? extractData(result) : undefined;
    logger.endStep('success', data);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.endStep('warning', { usingDefault: true }, message);
    return defaultValue;
  }
}
