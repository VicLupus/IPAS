import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatApi, ChatMessage } from '../api/chat';

const styles = {
  chatButton: {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  chatButtonHover: {
    transform: 'scale(1.1)',
    boxShadow: '0 6px 25px rgba(0, 0, 0, 0.4)',
  },
  chatWindow: {
    position: 'fixed' as const,
    bottom: '90px',
    right: '20px',
    width: '400px',
    height: '600px',
    maxHeight: '80vh',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 1001,
    overflow: 'hidden',
  },
  chatHeader: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '12px 12px 0 0',
  },
  chatTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background 0.2s',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  message: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    width: '100%',
  },
  userMessage: {
    alignSelf: 'flex-end' as const,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '12px 12px 0 12px',
    fontSize: '0.9rem',
    lineHeight: '1.4',
    maxWidth: '85%',
    marginLeft: 'auto',
  },
  assistantMessage: {
    alignSelf: 'flex-start' as const,
    background: '#f0f0f0',
    color: '#333',
    padding: '0.75rem 1rem',
    borderRadius: '12px 12px 12px 0',
    fontSize: '0.9rem',
    lineHeight: '1.4',
    maxWidth: '85%',
    marginRight: 'auto',
  },
  inputContainer: {
    padding: '1rem',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
  },
  sendButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'opacity 0.2s',
  },
  sendButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  loadingIndicator: {
    alignSelf: 'flex-start' as const,
    background: '#f0f0f0',
    padding: '0.75rem 1rem',
    borderRadius: '12px 12px 12px 0',
    fontSize: '0.9rem',
    color: '#666',
  },
};

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      chatApi.sendMessage(message, conversationHistory),
    onSuccess: (data) => {
      // 서버에서 반환한 전체 대화 히스토리로 메시지 업데이트
      setMessages(data.conversationHistory.filter(msg => msg.role !== 'system'));
      setConversationHistory(data.conversationHistory);
      setInputValue('');
    },
    onError: (error: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `오류가 발생했습니다: ${error.response?.data?.error || error.message}`,
        },
      ]);
    },
  });

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(inputValue.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        style={{
          ...styles.chatButton,
          ...(isHovered ? styles.chatButtonHover : {}),
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="AI 챗봇 열기"
      >
        💬
      </button>

      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.chatHeader}>
            <h3 style={styles.chatTitle}>보험상품 상담 챗봇</h3>
            <button
              style={styles.closeButton}
              onClick={() => setIsOpen(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              ×
            </button>
          </div>

          <div style={styles.messagesContainer}>
            {messages.length === 0 && (
              <div style={styles.assistantMessage}>
                안녕하세요! 보험상품에 대해 궁금한 점이 있으시면 언제든지 물어보세요.
                등록된 보험상품에 대한 정보를 제공해드릴 수 있습니다.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={styles.message}
              >
                <div
                  style={
                    msg.role === 'user'
                      ? styles.userMessage
                      : styles.assistantMessage
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div style={styles.loadingIndicator}>답변을 생성하는 중...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={styles.inputContainer}>
            <input
              style={styles.input}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={chatMutation.isPending}
            />
            <button
              style={{
                ...styles.sendButton,
                ...(chatMutation.isPending ? styles.sendButtonDisabled : {}),
              }}
              onClick={handleSend}
              disabled={chatMutation.isPending || !inputValue.trim()}
              onMouseEnter={(e) => {
                if (!chatMutation.isPending && inputValue.trim()) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              전송
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBot;

