#!/usr/bin/env ts-node

/**
 * Utility Functions Tests
 * Tests for helper functions and utilities
 */

import { maskSecret } from '../src/utils/helpers';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
}

class UtilityTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Utility Functions Test Suite');
    console.log('===============================');

    await this.testHelperFunctions();

    this.printSummary();
  }

  private async testHelperFunctions(): Promise<void> {
    console.log('\n🔧 Testing Helper Functions...');

    await this.runTest('maskSecret function', async () => {
      const result1 = maskSecret('short');
      const result2 = maskSecret('this-is-a-long-secret-value');
      const result3 = maskSecret('');
      
      if (result1 !== '****' || !result2.includes('****') || result3 !== '****') {
        throw new Error(`maskSecret failed: ${result1}, ${result2}, ${result3}`);
      }
    });

  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    try {
      await testFn();
      this.results.push({ name, success: true });
      console.log(`  ✅ ${name}`);
    } catch (error) {
      this.results.push({ 
        name, 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.log(`  ❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log('\n📊 Test Summary');
    console.log('===============');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total:  ${this.results.length}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
  }
}

// Run if this file is executed directly
if (require.main === module) {
  const tester = new UtilityTester();
  tester.runAllTests().catch(console.error);
}

export { UtilityTester };
