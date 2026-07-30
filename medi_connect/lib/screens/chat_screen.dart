import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/chat_provider.dart';
import '../services/chat_firestore_service.dart';
import '../theme/app_colors.dart';
import '../widgets/message_bubble.dart';
import '../models/chat_message_model.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String? doctorId;
  final String? doctorName;
  final String? doctorSpecialty;
  final String? doctorImageUrl;
  final bool isAIChat;

  const ChatScreen({
    super.key,
    this.doctorId,
    this.doctorName,
    this.doctorSpecialty,
    this.doctorImageUrl,
    this.isAIChat = false,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String? _chatId;
  Stream<List<ChatMessage>>? _messagesStream;

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    if (!widget.isAIChat && widget.doctorId != null) {
      Future.microtask(() async {
        try {
          final svc = ref.read(chatFirestoreServiceProvider);
          final id = await svc.getOrCreateChatId(doctorId: widget.doctorId!);
          if (mounted) {
            setState(() {
              _chatId = id;
              _messagesStream = svc.messagesStream(id);
            });
          }
        } catch (e) {
          debugPrint('Chat init error: $e');
        }
      });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    if (widget.isAIChat) {
      await ref.read(chatProvider.notifier).sendMessage(text);
    } else {
      if (widget.doctorId == null) return;
      final svc = ref.read(chatFirestoreServiceProvider);
      if (_chatId == null) {
        final id = await svc.getOrCreateChatId(doctorId: widget.doctorId!);
        setState(() {
          _chatId = id;
          _messagesStream = svc.messagesStream(id);
        });
        await svc.sendMessage(id, text);
      } else {
        await svc.sendMessage(_chatId!, text);
      }
    }
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.isAIChat
        ? 'AI Health Assistant'
        : (widget.doctorName ?? 'Chat');
    final subtitle = widget.isAIChat
        ? 'Powered by Gemini AI'
        : (widget.doctorSpecialty ?? 'Online');
    final chatState = ref.watch(chatProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: widget.isAIChat
                  ? Colors.purple.withOpacity(0.15)
                  : AppColors.primary.withOpacity(0.15),
              backgroundImage:
                  (!widget.isAIChat && widget.doctorImageUrl != null)
                  ? NetworkImage(widget.doctorImageUrl!)
                  : null,
              child: (widget.isAIChat || widget.doctorImageUrl == null)
                  ? Icon(
                      widget.isAIChat ? Icons.smart_toy_outlined : Icons.person,
                      size: 18,
                      color: widget.isAIChat
                          ? Colors.purple
                          : AppColors.primary,
                    )
                  : null,
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textHint,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          if (widget.isAIChat)
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              onPressed: () => ref.read(chatProvider.notifier).clearChat(),
              tooltip: 'Clear chat',
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: widget.isAIChat
                ? (chatState.messages.isEmpty
                      ? const Center(
                          child: Text(
                            'Start a conversation',
                            style: TextStyle(color: AppColors.textHint),
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: chatState.messages.length,
                          itemBuilder: (context, index) {
                            final msg = chatState.messages[index];
                            return MessageBubble(
                              message: msg.content,
                              isMe: msg.isUser,
                              senderName: msg.isUser ? 'You' : title,
                              timestamp: msg.timestamp,
                              deliveredAt: msg.deliveredAt,
                              readAt: msg.readAt,
                              avatarUrl: msg.isUser
                                  ? null
                                  : widget.doctorImageUrl,
                              showAvatar: !msg.isUser,
                            );
                          },
                        ))
                : (_messagesStream == null
                      ? const Center(child: CircularProgressIndicator())
                      : StreamBuilder<List<ChatMessage>>(
                          stream: _messagesStream,
                          builder: (context, snapshot) {
                            final messages = snapshot.data ?? [];
                            if (messages.isEmpty) {
                              return const Center(
                                child: Text(
                                  'Start a conversation',
                                  style: TextStyle(color: AppColors.textHint),
                                ),
                              );
                            }

                            if (_chatId != null) {
                              Future.microtask(
                                () => ref
                                    .read(chatFirestoreServiceProvider)
                                    .markMessagesRead(_chatId!),
                              );
                            }

                            return ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.all(16),
                              itemCount: messages.length,
                              itemBuilder: (context, index) {
                                final msg = messages[index];
                                return MessageBubble(
                                  message: msg.content,
                                  isMe: msg.isUser,
                                  senderName: msg.isUser ? 'You' : title,
                                  timestamp: msg.timestamp,
                                  deliveredAt: msg.deliveredAt,
                                  readAt: msg.readAt,
                                  avatarUrl: msg.isUser
                                      ? null
                                      : widget.doctorImageUrl,
                                  showAvatar: !msg.isUser,
                                );
                              },
                            );
                          },
                        )),
          ),

          if (chatState.isLoading)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              alignment: Alignment.centerLeft,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 14,
                    backgroundColor: widget.isAIChat
                        ? Colors.purple.withOpacity(0.15)
                        : AppColors.primary.withOpacity(0.15),
                    child: Icon(
                      widget.isAIChat ? Icons.smart_toy_outlined : Icons.person,
                      size: 14,
                      color: widget.isAIChat
                          ? Colors.purple
                          : AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(
                      children: const [
                        _TypingDot(delay: 0),
                        SizedBox(width: 4),
                        _TypingDot(delay: 200),
                        SizedBox(width: 4),
                        _TypingDot(delay: 400),
                      ],
                    ),
                  ),
                ],
              ),
            ),

          if (widget.isAIChat && chatState.messages.length <= 1)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children:
                    [
                          'Check my symptoms',
                          'Health advice',
                          'Find a doctor',
                          'Medication info',
                        ]
                        .map(
                          (suggestion) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ActionChip(
                              label: Text(
                                suggestion,
                                style: const TextStyle(fontSize: 12),
                              ),
                              onPressed: () {
                                _controller.text = suggestion;
                                _send();
                              },
                              backgroundColor: AppColors.primary.withOpacity(
                                0.1,
                              ),
                              side: BorderSide(
                                color: AppColors.primary.withOpacity(0.3),
                              ),
                            ),
                          ),
                        )
                        .toList(),
              ),
            ),

          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 8,
              bottom: MediaQuery.of(context).viewInsets.bottom + 12,
            ),
            decoration: BoxDecoration(
              color: AppColors.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 8,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      hintStyle: const TextStyle(color: AppColors.textHint),
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _send,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.send_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TypingDot extends StatefulWidget {
  final int delay;
  const _TypingDot({required this.delay});

  @override
  State<_TypingDot> createState() => _TypingDotState();
}

class _TypingDotState extends State<_TypingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _animation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _controller.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (_, _) => Container(
        width: 6,
        height: 6,
        decoration: BoxDecoration(
          color: AppColors.textHint.withOpacity(0.4 + _animation.value * 0.6),
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
