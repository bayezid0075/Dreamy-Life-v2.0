import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  async process(job: Job<{ email: string; subject: string; body: string }>): Promise<void> {
    console.log(`Sending email to ${job.data.email}: ${job.data.subject}`);
    // Implement actual email sending logic here
  }
}
