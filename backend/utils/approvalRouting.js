const NATIONAL_LOCATIONS = new Set([
  'all india',
  'india',
  'central government',
  'union government'
]);

function normalizePortfolio(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\b(the|government|of|department|ministry|maharashtra)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLocation(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function portfolioMatchesDepartment(portfolio, department) {
  const normalizedDepartment = normalizePortfolio(department);
  if (!normalizedDepartment) {
    return false;
  }

  return String(portfolio || '')
    .split(/[;\n|]+/)
    .map(normalizePortfolio)
    .filter(Boolean)
    .some((normalizedPortfolio) =>
      normalizedPortfolio === normalizedDepartment ||
      normalizedPortfolio.startsWith(`${normalizedDepartment} `) ||
      normalizedDepartment.startsWith(`${normalizedPortfolio} `)
    );
}

function authorityMatchesBudget(authority, budget) {
  const budgetLocation = normalizeLocation(budget.state);
  const authorityLocation = normalizeLocation(authority.state);
  const locationMatches = NATIONAL_LOCATIONS.has(budgetLocation)
    ? NATIONAL_LOCATIONS.has(authorityLocation)
    : authorityLocation === budgetLocation;

  return locationMatches && portfolioMatchesDepartment(authority.ministry, budget.department);
}

module.exports = {
  authorityMatchesBudget
};
