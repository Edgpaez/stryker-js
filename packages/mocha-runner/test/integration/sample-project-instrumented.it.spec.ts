import { testInjector, factory, assertions } from '@stryker-mutator/test-helpers';
import { expect } from 'chai';
import { MutantCoverage } from '@stryker-mutator/api/core';

import { MochaTestRunner, createMochaTestRunnerFactory } from '../../src';
import { createMochaOptions } from '../helpers/factories';
import { resolveTestResource } from '../helpers/resolve-test-resource';

describe('Running an instrumented project', () => {
  let sut: MochaTestRunner;

  beforeEach(async () => {
    const spec = [
      resolveTestResource('sample-project-instrumented', 'MyMath.js'),
      resolveTestResource('sample-project-instrumented', 'MyMathSpec.js'),
    ];
    testInjector.options.mochaOptions = createMochaOptions({ spec });
    sut = testInjector.injector.injectFunction(createMochaTestRunnerFactory('__stryker2__'));
    await sut.init();
  });

  describe('dryRun', () => {
    it('should report perTest mutantCoverage when coverage analysis is "perTest"', async () => {
      const result = await sut.dryRun(factory.dryRunOptions({ coverageAnalysis: 'perTest' }));
      assertions.expectCompleted(result);
      const expectedMutantCoverage: MutantCoverage = {
        perTest: {
          'MyMath should be able 1 to a number': {
            '1': 1,
            '4': 1,
            '5': 1,
          },
          'MyMath should be able negate a number': {
            '1': 1,
            '6': 1,
            '7': 1,
          },
          'MyMath should be able to add two numbers': {
            '1': 1,
            '2': 1,
            '3': 1,
          },
          'MyMath should be able to recognize a negative number': {
            '1': 1,
            '8': 1,
            '9': 1,
            '10': 1,
            '11': 1,
            '12': 1,
            '13': 1,
            '14': 1,
            '15': 1,
          },
          'MyMath should be able to recognize that 0 is not a negative number': {
            '1': 1,
            '8': 1,
            '9': 1,
            '10': 1,
            '11': 1,
            '12': 1,
            '13': 1,
          },
        },
        static: {
          '0': 1,
        },
      };
      expect(result.mutantCoverage).deep.eq(expectedMutantCoverage);
    });

    it('should report static mutantCoverage when coverage analysis is "all"', async () => {
      const result = await sut.dryRun(factory.dryRunOptions({ coverageAnalysis: 'all' }));
      assertions.expectCompleted(result);
      const expectedMutantCoverage: MutantCoverage = {
        perTest: {},
        static: {
          '0': 1,
          '1': 5,
          '2': 1,
          '3': 1,
          '4': 1,
          '5': 1,
          '6': 1,
          '7': 1,
          '8': 2,
          '9': 2,
          '10': 2,
          '11': 2,
          '12': 2,
          '13': 2,
          '14': 1,
          '15': 1,
        },
      };
      expect(result.mutantCoverage).deep.eq(expectedMutantCoverage);
    });

    it('should not report mutantCoverage when coverage analysis is "off"', async () => {
      const result = await sut.dryRun(factory.dryRunOptions({ coverageAnalysis: 'off' }));
      assertions.expectCompleted(result);
      expect(result.mutantCoverage).undefined;
    });
  });

  describe('mutantRun', () => {
    it('should be able to survive a mutant', async () => {
      const result = await sut.mutantRun(factory.mutantRunOptions({ activeMutant: factory.mutant({ id: '0' }) }));
      assertions.expectSurvived(result);
    });

    it('should be able to kill a mutant', async () => {
      const result = await sut.mutantRun(factory.mutantRunOptions({ activeMutant: factory.mutant({ id: '3' }) }));
      assertions.expectKilled(result);
      expect(result.killedBy).eq('MyMath should be able to add two numbers');
      expect(result.failureMessage).eq('expected -3 to equal 7');
    });

    it('should bail after the first failed test', async () => {
      const result = await sut.mutantRun(factory.mutantRunOptions({ activeMutant: factory.mutant({ id: '3' }) }));
      assertions.expectKilled(result);
      expect(result.nrOfTests).eq(1);
    });

    it('should be able to kill a mutant with filtered test', async () => {
      const result = await sut.mutantRun(
        factory.mutantRunOptions({ activeMutant: factory.mutant({ id: '3' }), testFilter: ['MyMath should be able to add two numbers'] })
      );
      assertions.expectKilled(result);
      expect(result.killedBy).eq('MyMath should be able to add two numbers');
      expect(result.failureMessage).eq('expected -3 to equal 7');
    });

    it('should be able to survive if killer test is not filtered', async () => {
      const result = await sut.mutantRun(
        factory.mutantRunOptions({
          activeMutant: factory.mutant({ id: '3' }),
          testFilter: ['MyMath should be able negate a number', 'MyMath should be able to recognize a negative number'],
        })
      );
      assertions.expectSurvived(result);
    });
  });
});
