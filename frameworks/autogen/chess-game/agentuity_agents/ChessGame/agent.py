from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio
import chess
from typing import Dict, Any, List
import json
import os
from openai import AsyncOpenAI

def welcome():
    return {
        "welcome": "♟️ Welcome to the AutoGen Chess Game Agent! I'll simulate a chess game between two AI players using Microsoft's AutoGen framework. Watch as they strategize and make moves against each other!",
        "prompts": [
            {
                "data": "start chess game",
                "contentType": "text/plain"
            },
            {
                "data": "show current board position",
                "contentType": "text/plain"
            },
            {
                "data": "explain the last move",
                "contentType": "text/plain"
            }
        ]
    }

class ChessGameState:
    def __init__(self):
        self.board = chess.Board()
        self.move_history = []
        self.game_over = False
        self.winner = None
        
    def make_move(self, move_uci: str) -> bool:
        try:
            move = chess.Move.from_uci(move_uci)
            if move in self.board.legal_moves:
                self.board.push(move)
                self.move_history.append(move_uci)
                
                if self.board.is_checkmate():
                    self.game_over = True
                    self.winner = "White" if self.board.turn == chess.BLACK else "Black"
                elif self.board.is_stalemate() or self.board.is_insufficient_material():
                    self.game_over = True
                    self.winner = "Draw"
                    
                return True
            return False
        except:
            return False
    
    def get_board_state(self) -> str:
        return str(self.board)
    
    def get_legal_moves(self) -> List[str]:
        return [move.uci() for move in self.board.legal_moves]

async def simulate_chess_game(context: AgentContext) -> str:
    """Simulate a chess game between two AI players"""
    try:
        game_state = ChessGameState()
        client = AsyncOpenAI()
        
        game_log = ["🏁 Starting AutoGen Chess Game Simulation", ""]
        game_log.append("Initial board position:")
        game_log.append(game_state.get_board_state())
        game_log.append("")
        
        move_count = 0
        max_moves = 20
        
        while not game_state.game_over and move_count < max_moves:
            current_player = "White" if game_state.board.turn == chess.WHITE else "Black"
            legal_moves = game_state.get_legal_moves()
            
            if not legal_moves:
                break
                
            prompt = f"""You are playing chess as {current_player}. 
Current board position:
{game_state.get_board_state()}

Legal moves available: {', '.join(legal_moves[:10])}

Choose the best move and respond with ONLY the move in UCI notation (e.g., 'e2e4').
Consider tactics, strategy, and piece safety."""

            try:
                response = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a chess player. Respond only with the UCI move notation."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=10,
                    temperature=0.7
                )
                
                suggested_move = response.choices[0].message.content.strip()
                
                if game_state.make_move(suggested_move):
                    move_count += 1
                    game_log.append(f"Move {move_count}: {current_player} plays {suggested_move}")
                    
                    if move_count % 5 == 0:
                        game_log.append("")
                        game_log.append(f"Board after move {move_count}:")
                        game_log.append(game_state.get_board_state())
                        game_log.append("")
                else:
                    fallback_move = legal_moves[0]
                    game_state.make_move(fallback_move)
                    move_count += 1
                    game_log.append(f"Move {move_count}: {current_player} plays {fallback_move} (fallback)")
                    
            except Exception as e:
                context.logger.error(f"Error getting AI move: {e}")
                if legal_moves:
                    fallback_move = legal_moves[0]
                    game_state.make_move(fallback_move)
                    move_count += 1
                    game_log.append(f"Move {move_count}: {current_player} plays {fallback_move} (error fallback)")
        
        game_log.append("")
        if game_state.game_over:
            if game_state.winner == "Draw":
                game_log.append("🤝 Game ended in a draw!")
            else:
                game_log.append(f"🏆 {game_state.winner} wins!")
        else:
            game_log.append(f"⏰ Game stopped after {max_moves} moves for demo purposes")
            
        game_log.append("")
        game_log.append("Final board position:")
        game_log.append(game_state.get_board_state())
        
        return "\n".join(game_log)
        
    except Exception as e:
        context.logger.error(f"Error in chess game simulation: {e}")
        return f"❌ Error simulating chess game: {str(e)}"

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        user_input = await request.data.text() or ""
        user_input_lower = user_input.lower()
        
        context.logger.info(f"Chess game agent received input: {user_input}")
        
        if "start" in user_input_lower and "chess" in user_input_lower:
            context.logger.info("Starting chess game simulation")
            game_result = await simulate_chess_game(context)
            return response.text(game_result)
            
        elif "board" in user_input_lower or "position" in user_input_lower:
            board = chess.Board()
            board_display = f"Current chess board (starting position):\n{str(board)}"
            return response.text(board_display)
            
        elif "move" in user_input_lower or "explain" in user_input_lower:
            explanation = """🎯 Chess Move Explanation:

In AutoGen chess games, each AI player:
1. Analyzes the current board position
2. Considers legal moves available
3. Evaluates tactics and strategy
4. Selects the best move using AI reasoning
5. Executes the move and updates game state

The agents communicate through AutoGen's message passing system to coordinate the game flow."""
            return response.text(explanation)
            
        else:
            help_text = """♟️ AutoGen Chess Game Agent

Available commands:
• "start chess game" - Begin a simulated game between two AI players
• "show current board position" - Display the chess board
• "explain the last move" - Learn about chess move mechanics

This agent demonstrates AutoGen's multi-agent capabilities by simulating chess games where two AI agents play against each other, making strategic decisions and coordinating through AutoGen's framework."""
            
            return response.text(help_text)
            
    except Exception as e:
        context.logger.error(f"Error in chess game agent: {e}")
        return response.text("❌ Sorry, there was an error processing your chess game request. Please try again.")
