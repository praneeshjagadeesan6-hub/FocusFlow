const getRiskStatus = (riskScore) => (riskScore > 60 ? 'Flagged' : riskScore > 30 ? 'Warning' : 'Safe');

const scanContentForRisk = (content = '') => {
  const text = String(content || '').toLowerCase().trim();

  if (!text) {
    return {
      riskScore: 0,
      aiStatus: 'Safe',
      issues: ['No content supplied'],
    };
  }

  const rules = [
    { test: /\b(hate|kill|attack|bomb|hurt|stab|murder|weapon)\b/, message: 'Violent or harmful language detected' },
    { test: /\b(sex|nude|porn|explicit|xxx|adult)\b/, message: 'Explicit or inappropriate content detected' },
    { test: /\b(scam|steal|hack|fraud|phish|spam)\b/, message: 'Suspicious or harmful behavior detected' },
    { test: /\b(drug|cocaine|weed|meth|illegal)\b/, message: 'Illegal or unsafe activity reference' },
    { test: /\b(you are stupid|idiot|worthless|useless)\b/, message: 'Abusive or degrading language detected' },
    { test: /[!]{3,}/, message: 'Spam-like repeated punctuation pattern' },
    { test: /^.{250,}$/, message: 'Very long content is often used for spam or flooding' },
  ];

  const issues = [];
  let riskScore = 0;

  rules.forEach((rule) => {
    if (rule.test.test(text)) {
      issues.push(rule.message);
      riskScore += 20;
    }
  });

  if (/https?:\/\/\S+/.test(text)) {
    riskScore += 5;
  }

  if (text.length > 180) {
    riskScore += 5;
  }

  riskScore = Math.min(100, riskScore + issues.length * 5);

  const aiStatus = getRiskStatus(riskScore);

  if (issues.length === 0) {
    issues.push('Healthy and safe communication pattern');
  }

  return {
    riskScore,
    aiStatus,
    issues,
  };
};

module.exports = { scanContentForRisk, getRiskStatus };
