#!/usr/bin/env python3
"""Test script to verify the agent can be imported and basic functionality works."""

import sys
import os
sys.path.append('.')

try:
    from agents.FinanceAgent.agent import welcome, run
    print('✅ Successfully imported welcome and run functions')
    
    welcome_result = welcome()
    print(f'✅ Welcome function works: {welcome_result}')
    
    print('✅ All imports and basic functionality verified')
    print('✅ Agent is ready for testing with actual requests')
    
except ImportError as e:
    print(f'❌ Import error: {e}')
    sys.exit(1)
except Exception as e:
    print(f'❌ Error: {e}')
    sys.exit(1)
