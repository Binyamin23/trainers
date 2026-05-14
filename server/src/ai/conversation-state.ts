import { AiChatIntentType } from "./ai.types";

export interface CancellationOption {
  id: string;
  startsAt: Date;
  endsAt: Date;
}

export interface ConversationState {
  phone: string;
  lastIntent?: AiChatIntentType;
  lastDate?: string | null;
  lastTime?: string | null;
  lastTrainerId?: string | null;
  lastAvailableSlots?: string[];
  lastCancellationOptions?: CancellationOption[];
  updatedAt: Date;
}

const conversationStates = new Map<string, ConversationState>();

export const getConversationState = (
  phone: string
): ConversationState | undefined => conversationStates.get(phone);

export const updateConversationState = (
  phone: string,
  partialState: Partial<Omit<ConversationState, "phone" | "updatedAt">>
): ConversationState => {
  const currentState = conversationStates.get(phone);
  const nextState: ConversationState = {
    phone,
    ...currentState,
    ...partialState,
    updatedAt: new Date(),
  };

  conversationStates.set(phone, nextState);

  return nextState;
};

export const clearConversationState = (phone: string): void => {
  conversationStates.delete(phone);
};
