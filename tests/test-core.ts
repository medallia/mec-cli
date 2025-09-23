#!/usr/bin/env ts-node

/**
 * Core Module Tests
 * Tests for core services, configuration, and container functionality
 */

import { CoreContainer, ProfileManager } from '../src/core';
import { ProfileConfig, Profile } from '../src/core/config/types';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
}

class CoreTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Core Module Test Suite');
    console.log('========================');

    await this.testCoreContainer();
    await this.testConfigService();
    await this.testProfileManager();

    this.printSummary();
  }

  private async testCoreContainer(): Promise<void> {
    console.log('\n📦 Testing CoreContainer...');

    await this.runTest('CoreContainer initialization', async () => {
      const container = new CoreContainer();
      await container.initialize();
      const configService = container.getConfigService();
      if (!configService) throw new Error('ConfigService not available');
    });

    await this.runTest('CoreContainer service creation', async () => {
      const container = new CoreContainer();
      await container.initialize();
      
      // Create a minimal profile for testing
      const testProfile: Profile = {
        name: 'test',
        baseUrl: 'https://api.example.com',
        oauth2: {
          tokenUrl: 'https://example.com/token',
          clientId: 'test-client',
          clientSecret: 'test-secret'
        },
        outputPath: './test-output'
      };

      const surveysService = await container.getSurveyService(testProfile);
      const translationsService = await container.getTranslationService(testProfile);
      
      if (!surveysService || !translationsService) {
        throw new Error('Services not created');
      }
    });
  }

  private async testConfigService(): Promise<void> {
    console.log('\n⚙️  Testing ConfigService...');

    await this.runTest('ConfigService initialization', async () => {
      const container = new CoreContainer();
      await container.initialize();
      const configService = container.getConfigService();
      
      // Test listing profiles (should not throw)
      await configService.listProfiles();
      // Empty array is valid
    });

    await this.runTest('Profile save and retrieve', async () => {
      const container = new CoreContainer();
      await container.initialize();
      const configService = container.getConfigService();

      const testConfig: ProfileConfig = {
        tokenUrl: 'https://test.example.com/token',
        oAuthClientId: 'test-client-id',
        oAuthClientSecret: 'test-secret',
        apiGatewayUrl: 'https://test-api.example.com',
        languages: 'English',
        outputPath: './test-output',
        includeHtmlBlocks: false
      };

      await configService.saveProfile('test-profile', testConfig);
      const retrieved = await configService.getProfile('test-profile');
      
      if (retrieved.oAuthClientId !== testConfig.oAuthClientId) {
        throw new Error('Profile data mismatch');
      }

      // Clean up
      await configService.deleteProfile('test-profile');
    });

    await this.runTest('Profile validation', async () => {
      const container = new CoreContainer();
      await container.initialize();
      const configService = container.getConfigService();

      // Test that incomplete profiles are handled
      const incompleteProfile = await configService.findProfile('non-existent');
      if (incompleteProfile !== undefined) {
        throw new Error('Should return undefined for non-existent profile');
      }
    });
  }

  private async testProfileManager(): Promise<void> {
    console.log('\n👤 Testing ProfileManager...');

    await this.runTest('ProfileManager config conversion', async () => {
      const testConfig: ProfileConfig = {
        tokenUrl: 'https://test.example.com/token',
        oAuthClientId: 'test-client-id',
        oAuthClientSecret: 'test-secret',
        apiGatewayUrl: 'https://test-api.example.com',
        languages: 'English',
        outputPath: './test-output',
        includeHtmlBlocks: false
      };

      const profile = ProfileManager.configToProfile('test', testConfig);
      
      if (profile.name !== 'test' || profile.oauth2.clientId !== testConfig.oAuthClientId) {
        throw new Error('Profile conversion failed');
      }
    });

    await this.runTest('ProfileManager completeness check', async () => {
      const completeConfig: ProfileConfig = {
        tokenUrl: 'https://test.example.com/token',
        oAuthClientId: 'test-client-id',
        oAuthClientSecret: 'test-secret',
        apiGatewayUrl: 'https://test-api.example.com',
        languages: 'English',
        outputPath: './test-output',
        includeHtmlBlocks: false
      };

      const incompleteConfig: ProfileConfig = {
        tokenUrl: '',
        oAuthClientId: '',
        oAuthClientSecret: '',
        apiGatewayUrl: '',
        languages: 'English',
        outputPath: './test-output',
        includeHtmlBlocks: false
      };

      const isComplete = ProfileManager.isProfileComplete(completeConfig);
      const isIncomplete = ProfileManager.isProfileComplete(incompleteConfig);
      
      if (!isComplete || isIncomplete) {
        throw new Error('Profile completeness check failed');
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
  const tester = new CoreTester();
  tester.runAllTests().catch(console.error);
}

export { CoreTester };
