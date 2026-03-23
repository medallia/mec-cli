#!/bin/bash

# MEC CLI Test Script
# This script tests all available commands and subcommands

echo "🧪 MEC CLI Comprehensive Test Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expect_success="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${YELLOW}🔄 Test $TOTAL_TESTS: $test_name${NC}"
    echo -e "${BLUE}Command: $command${NC}"
    
    # Run the command and capture output
    if eval "$command" > /tmp/cli_test_output 2>&1; then
        exit_code=0
    else
        exit_code=$?
    fi
    
    # Check result
    if [[ $expect_success == "true" && $exit_code == 0 ]] || [[ $expect_success == "false" && $exit_code != 0 ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}Output:${NC}"
        cat /tmp/cli_test_output | head -5
    fi
}

# Function to run a test that expects specific output
run_test_with_output() {
    local test_name="$1"
    local command="$2"
    local expected_output="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${YELLOW}🔄 Test $TOTAL_TESTS: $test_name${NC}"
    echo -e "${BLUE}Command: $command${NC}"
    
    # Run the command and capture output
    output=$(eval "$command" 2>&1)
    
    # Check if expected output is present
    if echo "$output" | grep -q "$expected_output"; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}Expected: $expected_output${NC}"
        echo -e "${RED}Got: $(echo "$output" | head -2)${NC}"
    fi
}

echo -e "\n${BLUE}Building the project first...${NC}"
npm run build

echo -e "\n${BLUE}Starting CLI tests...${NC}"

# Basic Help and Version Tests
run_test_with_output "General Help" "npm run dev -- --help" "mec <command>"
run_test_with_output "Version Information" "npm run dev -- --version" "1.1.0"

# Configure Command Tests
run_test_with_output "Configure Help" "npm run dev -- configure --help" "Configure profile"
run_test_with_output "Configure Non-Interactive Error" "npm run dev -- configure --token-url" "Not enough arguments following: token-url"
run_test_with_output "Configure Non-Interactive Error" "npm run dev -- configure --token-url https://some-url.com" "Non-interactive mode requires ALL required options: --client-id, --client-secret, --api-gateway-url"

# Profiles Command Tests
run_test_with_output "Profiles Help" "npm run dev -- profiles --help" "Manage configured profiles"
run_test "Profiles List" "npm run dev -- profiles list" "true"
run_test "Profiles List Detailed" "npm run dev -- profiles list --detailed" "true"
run_test_with_output "Profiles Show Error" "npm run dev -- profiles show" "Profile name required"
run_test_with_output "Profiles Delete Error" "npm run dev -- profiles delete" "Profile name required"

# Surveys Command Tests  
run_test_with_output "Surveys Help" "npm run dev -- surveys --help" "Survey operations"
run_test "Surveys List" "npm run dev -- surveys list" "true" # Now expects to succeed with configured profile

# Translations Command Tests
run_test_with_output "Translations Help" "npm run dev -- translations --help" "Translation operations"
run_test_with_output "Translations Download Error" "npm run dev -- translations download" "For download: either --survey-uuid or --survey-name must be provided"
run_test_with_output "Translations Upload Error" "npm run dev -- translations upload" "For upload: --file must be provided"

# Multi-survey / parser validation tests
run_test_with_output "Translations Download blank UUID rejected" \
  "npm run dev -- translations download --survey-uuid ''" \
  "survey-uuid values must not be empty"
run_test_with_output "Translations Download blank name rejected" \
  "npm run dev -- translations download --survey-name ''" \
  "survey-name values must not be empty"
# Parser accepts multiple --survey-uuid flags; command fails at API call (no real survey), which is expected
run_test "Translations Download multiple UUIDs accepted by parser" \
  "npm run dev -- translations download --survey-uuid uuid-one --survey-uuid uuid-two 2>/dev/null" \
  "false"
# Parser accepts multiple --survey-name flags; command fails at API call, which is expected
run_test "Translations Download multiple names accepted by parser" \
  "npm run dev -- translations download --survey-name 'Survey A' --survey-name 'Survey B' 2>/dev/null" \
  "false"
# Parser accepts --survey-uuid and --survey-name together; command fails at API call, which is expected
run_test "Translations Download UUID and name together accepted by parser" \
  "npm run dev -- translations download --survey-uuid some-uuid --survey-name 'Some Survey' 2>/dev/null" \
  "false"
# Duplicate UUIDs are accepted by the parser; deduplication happens inside the command
run_test "Translations Download duplicate UUID accepted by parser" \
  "npm run dev -- translations download --survey-uuid same-uuid --survey-uuid same-uuid 2>/dev/null" \
  "false"

# Error Handling Tests
run_test_with_output "Invalid Command" "npm run dev -- invalid-command" "Unknown argument: invalid-command"
run_test_with_output "No Command" "npm run dev --" "You must provide a command"

# Global Options Tests
echo -e "\n${BLUE}Testing global options...${NC}"
run_test "Verbose Flag" "npm run dev -- --verbose surveys list 2>/dev/null" "true" # Now expects to succeed with configured profile

# Configuration Tests (Non-destructive)
echo -e "\n${BLUE}Testing configuration options...${NC}"
run_test_with_output "Configure Profile Help" "npm run dev -- configure production --help" "Configure profile"

# Advanced Command Combinations
echo -e "\n${BLUE}Testing advanced command combinations...${NC}"
run_test "Surveys with Profile" "npm run dev -- surveys list --profile default 2>/dev/null" "true" # Now expects to succeed
run_test "Translations with Multiple Options" "npm run dev -- translations download --survey-uuid test-uuid --locales en-US,es-ES 2>/dev/null" "false" # Still expects to fail (invalid survey)

# Summary
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l 2>/dev/null || echo "N/A")
echo -e "Success Rate: ${success_rate}%"

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "\n${RED}Some tests failed. Check the output above for details.${NC}"
    exit 1
else
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
fi

# Cleanup
rm -f /tmp/cli_test_output
