#!/usr/bin/env ts-node

/**
 * Translations Service Tests
 * Tests for translation service helper functions
 */

import { TranslationsService } from "../src/core";

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
}

class TranslationsTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Translations Service Test Suite');
    console.log('==================================');

    await this.testHtmlBlockDetection();
    await this.testVariableDetection();

    this.printSummary();
  }

  private async testHtmlBlockDetection(): Promise<void> {
    console.log('\n🏷️  Testing HTML Block Detection...');

    await this.runTest('containsHtmlBlocks - HTML tags', async () => {
      const testCases = [
        { text: '<div>Hello world</div>', expected: true },
        { text: '<p>Test paragraph</p>', expected: true },
        { text: '<a href="https://example.com">Link</a>', expected: true },
        { text: '<span class="highlight">Text</span>', expected: true },
        { text: '<div><span>Hi</span></div>', expected: true },
        { text: '<img src="image.jpg" alt="Image"/>', expected: true },
        {
            text: `<html>
                        <img src="https://us.cdn.survey.medallia.com/b6a0c8a98d12019cffaf4e3229081194cbfffb9c" alt="img1" height="233" width="450"/>
                        <table align="center" width="450px"> 
                            <tr>
                                <td align="left">
                                    <img src="https://us.cdn.survey.medallia.com/b6a0c8a98d12019cffaf4e3229081194cbfffb9c" alt="img1" height="233" width="450"/>
                                </td>  
                            </tr>
                        </table>
                    </html>`,
            expected: true
        },
        { text: '<br/>', expected: true },
        { text: '[br]', expected: true },
      ];

      for (const testCase of testCases) {
        const result = TranslationsService.containsHtmlBlocks(testCase.text);
        if (result !== testCase.expected) {
          throw new Error(`HTML tag test failed for "${testCase.text}": expected ${testCase.expected}, got ${result}`);
        }
      }
    });

    await this.runTest('containsHtmlBlocks - pseudo-HTML patterns', async () => {
      const testCases = [
        { text: '[a href="https://example.com"]Link[/a]', expected: true },
        { text: '[b]Bold text[/b]', expected: true },
        { text: '[u]Underlined text[/u]', expected: true },
        { text: '[i]Italic text[/i]', expected: true },
        { text: '[color="red"]Red text[/color]', expected: true },
        { text: '[font size="12"]Text[/font]', expected: true },
      ];

      for (const testCase of testCases) {
        const result = TranslationsService.containsHtmlBlocks(testCase.text);
        if (result !== testCase.expected) {
          throw new Error(`Pseudo-HTML test failed for "${testCase.text}": expected ${testCase.expected}, got ${result}`);
        }
      }
    });

    await this.runTest('containsHtmlBlocks - plain text', async () => {
      const testCases = [
        { text: 'Just plain text', expected: false },
        { text: 'Text with numbers 123', expected: false },
        { text: 'Text with symbols !@#$%^&*()', expected: false },
        { text: 'Text with parentheses (like this)', expected: false },
        { text: '', expected: false },
      ];

      for (const testCase of testCases) {
        const result = TranslationsService.containsHtmlBlocks(testCase.text);
        if (result !== testCase.expected) {
          throw new Error(`Plain text test failed for "${testCase.text}": expected ${testCase.expected}, got ${result}`);
        }
      }
    });

    await this.runTest('containsHtmlBlocks - invalid cases', async () => {
      const testCases = [
        { text: 'Text with > but no opening <', expected: false },
        { text: 'Text with incomplete]', expected: false },
        { text: 'Text with [=variable] but no HTML', expected: false },
        { text: '<p>Text without closing', expected: false },
        { text: 'Text without opening</p>', expected: false },
        { text: 'Text with [square brackets] but not pseudo-HTML', expected: false },
        { text: 'Text with angle brackets but not tags < and >', expected: false },
        { text: '[br/]', expected: false }, // Based on manual testing
      ];

      for (const testCase of testCases) {
        const result = TranslationsService.containsHtmlBlocks(testCase.text);
        if (result !== testCase.expected) {
          throw new Error(`Edge case test failed for "${testCase.text}": expected ${testCase.expected}, got ${result}`);
        }
      }
    });
  }

  private async testVariableDetection(): Promise<void> {
    console.log('\n🔧 Testing Variable Detection...');

    await this.runTest('containsVariables - valid variables', async () => {
      const testCases = [
        { text: 'Hello [=user_name]!', expected: true },
        { text: 'Welcome to [=company_name]-[]followed by chars', expected: true },
        { text: 'Multiple [=var1] and [=var2]', expected: true },
        { text: 'Variable with numbers [=item_123]', expected: true },
        { text: 'Variable with value [=q_foobar:something]', expected: true },
        { text: 'Shows different store names [=u_storename]', expected: true },
        { text: 'Standard field placeholder [=e_firstname:json-string]', expected: true },
        { text: 'Standard field placeholder, [=e_firstname:html]', expected: true },
        { text: '[=?<field>:<text>:html] — Shows text value if the variable does not exist [=e_firstname:John:html]', expected: true },
        { text: 'Formats date variable [=e_checkin:dd/MM/yyyy:html]', expected: true },
        { text: '[=:<locale>:<text>:html] — Shows the text entry when a language matches the survey language [=fr:magasin:html]', expected: true },
        { text: '[=%<context>:<text>:html] — Context refers to the screen modes for available for survey display such as desktop (%dt) and mobile (%mb) Mobile eg: [=%mb:Share your location:html]', expected: true },
        { text: '[=%<context>:<text>:html] — Context refers to the screen modes for available for survey display such as desktop (%dt) and mobile (%mb) Desktop eg: [=%dt:Share your location:html]', expected: true },
      ];

      for (const testCase of testCases) {
        const result = TranslationsService.containsVariables(testCase.text);
        if (result !== testCase.expected) {
          throw new Error(`Variable test failed for "${testCase.text}": expected ${testCase.expected}, got ${result}`);
        }
      }
    });

    await this.runTest('containsVariables - invalid patterns', async () => {
      const testCases = [
        { text: '', expected: false },
        { text: 'Plain text without variables', expected: false },
        { text: 'Text with [brackets] but no variables', expected: false },
        { text: 'Text with [=] empty variable', expected: false },
        { text: 'Text with [= ] empty variable', expected: false },
        { text: 'Text with [= space_start]', expected: false },
      ];

      for (const testCase of testCases) {
        const result = TranslationsService.containsVariables(testCase.text);
        if (result !== testCase.expected) {
          throw new Error(`Invalid variable test failed for "${testCase.text}": expected ${testCase.expected}, got ${result}`);
        }
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
  const tester = new TranslationsTester();
  tester.runAllTests().catch(console.error);
}

export { TranslationsTester };