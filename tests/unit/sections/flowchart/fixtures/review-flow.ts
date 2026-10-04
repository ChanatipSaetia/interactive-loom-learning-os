import { parseFlowchart } from './parse-flowchart';

// draft -> test -> fork: pass (publish) | fail (rewrite)
export const { flow: reviewFlow } = parseFlowchart({
  type: 'flowchart',
  flow: {
    actors: { writer: { title: 'Writer' }, tester: { title: 'Tester' } },
    systems: {
      repo: { title: 'Repo', type: 'aggregate' },
      staging: { title: 'Staging', type: 'external' },
      site: { title: 'Site', type: 'external' },
    },
    steps: [
      {
        id: 'step_draft', type: 'linear', initiatedBy: 'writer', policy: 'On change', command: 'Open PR',
        handledBy: 'repo', resultEvents: [{ id: 'drafted', title: 'Drafted' }], continuesAs: 'step_test',
      },
      {
        id: 'step_test', type: 'linear', initiatedBy: 'tester', policy: 'After draft', command: 'Test steps',
        handledBy: 'staging', resultEvents: [{ id: 'tested', title: 'Tested' }], continuesAs: 'fork',
      },
      {
        id: 'fork', type: 'branch', event: 'tested',
        branches: [
          {
            id: 'opt_pass', label: 'It worked', policy: 'If it worked', command: 'Publish', handledBy: 'site',
            resultEvents: [{ id: 'published', title: 'Published' }],
          },
          {
            id: 'opt_fail', label: 'It failed', dashed: true, policy: 'If it failed', command: 'Send back',
            handledBy: 'repo', resultEvents: [{ id: 'sent_back', title: 'Sent back' }],
          },
        ],
      },
    ],
    journeys: [
      {
        id: 'pass', label: 'Pass', description: 'It works',
        steps: [
          { stepId: 'step_draft', name: 'Draft', description: 'Draft it' },
          { stepId: 'step_test', name: 'Test', description: 'Test it' },
          { stepId: 'opt_pass', name: 'Publish', description: 'Ship it' },
        ],
      },
      {
        id: 'fail', label: 'Fail', description: 'It breaks',
        steps: [
          { stepId: 'step_draft', name: 'Draft', description: 'Draft it' },
          { stepId: 'step_test', name: 'Test', description: 'Test it' },
          { stepId: 'opt_fail', name: 'Rewrite', description: 'Fix it' },
        ],
      },
    ],
  },
});
