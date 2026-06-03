const { buildSummarizePrompt } = require('../../src/prompts/summarize');
const { buildRagAnswerPrompt } = require('../../src/prompts/ragAnswer');

describe('buildSummarizePrompt', () => {
  it('includes the article text in the prompt', () => {
    const articleText = 'Karachi is the largest city in Pakistan.';
    const prompt = buildSummarizePrompt(articleText);

    expect(prompt).toContain(articleText);
    expect(prompt).toMatch(/summarize/i);
  });
});

describe('buildRagAnswerPrompt', () => {
  it('injects the user question and numbered context excerpts', () => {
    const prompt = buildRagAnswerPrompt('When was it founded?', [
      {
        text: 'The city was founded in 1729.',
        sectionTitle: 'History',
      },
      {
        text: 'It is a major port.',
        sectionTitle: 'Economy',
      },
    ]);

    expect(prompt).toContain('When was it founded?');
    expect(prompt).toContain('[1] Section: History');
    expect(prompt).toContain('The city was founded in 1729.');
    expect(prompt).toContain('[2] Section: Economy');
    expect(prompt).toContain('It is a major port.');
  });

  it('instructs the model to answer only from the provided excerpts', () => {
    const prompt = buildRagAnswerPrompt('Who built it?', [
      { text: 'Built by settlers.', sectionTitle: 'History' },
    ]);

    expect(prompt).toMatch(/only the provided excerpts/i);
    expect(prompt).toMatch(/read all excerpts/i);
    expect(prompt).toMatch(/spelling variants/i);
    expect(prompt).toMatch(/do not use outside knowledge/i);
    expect(prompt).toMatch(/cannot find.*in the article/i);
  });
});
