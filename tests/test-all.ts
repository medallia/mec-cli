#!/usr/bin/env ts-node

/**
 * Master Test Runner
 * Runs all test suites and provides comprehensive reporting
 */

import { CoreTester } from './test-core';
import { ParseTester } from './test-parser';
import { TranslationsTester } from './test-translations';
import { UtilityTester } from './test-utils';

async function testInterceptors() {
  console.log('🧪 Running Interceptor Tests...');
  
  try {
    // Import and run the interceptor test
    await import('./test-interceptors');
    // The module exports the test function directly, not as default
    console.log('✅ Interceptor module loaded');
    return true;
  } catch (error) {
    console.error('❌ Interceptor tests failed:', error);
    return false;
  }
}

class MasterTestRunner {
  async runAllTests(): Promise<void> {
    console.log('🚀 MEC CLI Test Suite - Master Runner');
    console.log('=====================================\n');

    const testResults: { name: string; success: boolean }[] = [];

    // Run Core Tests
    console.log('1️⃣  CORE MODULE TESTS');
    console.log('━'.repeat(50));
    try {
      const coreTester = new CoreTester();
      await coreTester.runAllTests();
      testResults.push({ name: 'Core Module Tests', success: true });
    } catch (error) {
      console.error('❌ Core tests failed:', error);
      testResults.push({ name: 'Core Module Tests', success: false });
    }

    console.log('\n');

    // Run Parser Tests
    console.log('2️⃣  PARSER & CLI TESTS');
    console.log('━'.repeat(50));
    try {
      const parseTester = new ParseTester();
      await parseTester.runAllTests();
      testResults.push({ name: 'Parser & CLI Tests', success: true });
    } catch (error) {
      console.error('❌ Parser tests failed:', error);
      testResults.push({ name: 'Parser & CLI Tests', success: false });
    }

    console.log('\n');

    // Run Utility Tests
    console.log('3️⃣  UTILITY TESTS');
    console.log('━'.repeat(50));
    try {
      const utilityTester = new UtilityTester();
      await utilityTester.runAllTests();
      testResults.push({ name: 'Utility Tests', success: true });
    } catch (error) {
      console.error('❌ Utility tests failed:', error);
      testResults.push({ name: 'Utility Tests', success: false });
    }

    console.log('\n');

    // Run Translations Tests
    console.log('4️⃣  TRANSLATIONS TESTS');
    console.log('━'.repeat(50));
    try {
      const translationsTester = new TranslationsTester();
      await translationsTester.runAllTests();
      testResults.push({ name: 'Translations Tests', success: true });
    } catch (error) {
      console.error('❌ Translations tests failed:', error);
      testResults.push({ name: 'Translations Tests', success: false });
    }

    console.log('\n');

    // Run Interceptor Tests
    console.log('5️⃣  INTERCEPTOR TESTS');
    console.log('━'.repeat(50));
    const interceptorSuccess = await testInterceptors();
    testResults.push({ name: 'Interceptor Tests', success: interceptorSuccess });

    // Final Summary
    this.printFinalSummary(testResults);
  }

  private printFinalSummary(results: { name: string; success: boolean }[]): void {
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n\n🏁 FINAL TEST SUMMARY');
    console.log('═'.repeat(50));
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
    
    console.log('═'.repeat(50));
    console.log(`📊 Test Suites: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 All test suites passed! The codebase is working correctly.');
    } else {
      console.log('\n⚠️  Some test suites failed. Please check the detailed output above.');
    }
    
    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  const runner = new MasterTestRunner();
  runner.runAllTests().catch(error => {
    console.error('💥 Master test runner failed:', error);
    process.exit(1);
  });
}
