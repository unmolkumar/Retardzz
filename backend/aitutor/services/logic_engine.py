"""Rule-based logic engine for deterministic chatbot responses."""
from typing import Optional


# ========================
# CRITICAL: HARD-CODED IDENTITY OVERRIDE
# ========================
# These responses are DETERMINISTIC and LOCKED.
# They override ALL other logic including AI generation.
#
# Why this is necessary:
# - Prevents AI from hallucinating different identities
# - Prevents mentions of OpenAI, Meta, or other companies
# - Ensures consistent identity across all conversations
# - No memory contamination or "as I mentioned earlier" issues
# - No variation in wording for identity questions
#
# NEVER make these responses dynamic or AI-generated.
# ========================

def _detect_identity_intent(message: str) -> Optional[str]:
	"""
	Detect identity-related questions and return hard-coded responses.
	
	This function MUST execute before any AI call to ensure identity
	responses are deterministic and never vary.
	
	Returns:
		str: Hard-coded response if identity intent is detected
		None: If no identity intent detected (proceed to other logic/AI)
	"""
	normalized = message.strip().lower()
	
	# Remove common question words and punctuation for better matching
	normalized = normalized.replace("?", "").replace(".", "").replace(",", "")
	
	# 1. NAME DETECTION
	# Patterns: "what is your name", "what's your name", "your name", "name?"
	if any(pattern in normalized for pattern in [
		"what is your name",
		"what's your name",
		"whats your name",
		"tell me your name",
		"what are you called",
		"what do they call you",
	]) or normalized in {"your name", "name"}:
		return "My name is ChatTutor."
	
	# 2. PRONOUNS DETECTION (must be before "what are you" check)
	# Patterns: "what are your pronouns", "he or she", "gender"
	if any(pattern in normalized for pattern in [
		"your pronouns",
		"what pronouns",
		"he or she",
		"he she",
		"are you male",
		"are you female",
		"what gender",
		"your gender",
	]):
		return "You can refer to me as he/him."
	
	# 3. NATURE/TYPE DETECTION
	# Patterns: "what are you", "what kind of ai", "are you a bot"
	if any(pattern in normalized for pattern in [
		"what are you",
		"what kind of ai",
		"what type of ai",
		"are you a bot",
		"are you an ai",
		"are you human",
		"what kind of bot",
	]):
		return "I'm a Large Language Model designed to assist with information and communication."
	
	# 4. ORIGIN/CREATOR DETECTION
	# Patterns: "who made you", "who created you", "who built you", "what is your origin"
	if any(pattern in normalized for pattern in [
		"who made you",
		"who created you",
		"who built you",
		"who developed you",
		"what is your origin",
		"where do you come from",
		"where did you come from",
		"who is your creator",
		"who's your creator",
		"whos your creator",
		"your creator",
		"your origin",
		"made by",
		"created by",
		"developed by",
	]):
		return (
			"As for my origin, I'm a Large Language Model developed by a team of researchers "
			"and refined by Kush Dalal, a Computer Science student at Chandigarh University. "
			"Kush fine-tuned my capabilities to enable me to assist and communicate with humans "
			"in a helpful and informative way."
		)
	
	# No identity intent detected
	return None


def process_logic(message: str) -> Optional[str]:
	"""Apply simple keyword-based rules and return a response when matched."""
	if not message:
		return None

	# CRITICAL: Identity detection ALWAYS takes priority
	# This must execute BEFORE any other logic or AI call
	identity_response = _detect_identity_intent(message)
	if identity_response:
		return identity_response

	# Standard logic rules (only reached if not identity question)
	normalized = message.strip().lower()

	if normalized in {"hi", "hello", "hey"}:
		return "Hello! How can I assist you today?"

	if "help" in normalized:
		return "Sure, I'm here to help. Let me know what you need assistance with."

	# Generic "who are you" that doesn't match specific identity patterns
	# is covered by _detect_identity_intent, so this can be removed or serve as fallback
	if "who are you" in normalized:
		return "I'm your friendly chatbot assistant."

	return None
