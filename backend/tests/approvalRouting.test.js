const test = require('node:test');
const assert = require('node:assert/strict');
const { authorityMatchesBudget } = require('../utils/approvalRouting');

test('routes a Maharashtra department budget to its matching portfolio authority', () => {
  assert.equal(authorityMatchesBudget({
    state: 'Maharashtra',
    ministry: 'Agriculture'
  }, {
    state: 'Maharashtra',
    department: 'Agriculture Department, Maharashtra'
  }), true);
});

test('matches comma-separated portfolio names without matching unrelated departments', () => {
  const authority = { state: 'Maharashtra', ministry: 'Finance, Planning' };

  assert.equal(authorityMatchesBudget(authority, {
    state: 'Maharashtra',
    department: 'Finance Department, Maharashtra'
  }), true);
  assert.equal(authorityMatchesBudget(authority, {
    state: 'Maharashtra',
    department: 'Forest Department, Maharashtra'
  }), false);
});

test('does not route a department to an authority in a different state', () => {
  assert.equal(authorityMatchesBudget({
    state: 'Gujarat',
    ministry: 'Agriculture'
  }, {
    state: 'Maharashtra',
    department: 'Agriculture Department, Maharashtra'
  }), false);
});

test('only routes all-India budgets to national authorities', () => {
  assert.equal(authorityMatchesBudget({
    state: 'Maharashtra',
    ministry: 'Finance'
  }, {
    state: 'All India',
    department: 'Finance'
  }), false);
  assert.equal(authorityMatchesBudget({
    state: 'India',
    ministry: 'Finance'
  }, {
    state: 'All India',
    department: 'Finance'
  }), true);
});
