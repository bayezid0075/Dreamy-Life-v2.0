class AppNotification {
  final int id;
  final String title;
  final String message;
  final String? image;
  final String? link;
  final String source;
  final bool isRead;
  final String createdAt;

  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    this.image,
    this.link,
    this.source = 'system',
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as int,
      title: json['title'] as String,
      message: json['message'] as String? ?? '',
      image: json['image'] as String?,
      link: json['link'] as String?,
      source: json['source'] as String? ?? 'system',
      isRead: json['is_read'] as bool? ?? false,
      createdAt: json['created_at'] as String,
    );
  }
}
