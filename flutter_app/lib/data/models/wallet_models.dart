class Transaction {
  final int id;
  final String amount;
  final String transactionType;
  final String description;
  final String createdAt;

  const Transaction({
    required this.id,
    required this.amount,
    required this.transactionType,
    required this.description,
    required this.createdAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as int,
      amount: json['amount'] as String,
      transactionType: json['transaction_type'] as String? ?? 'credit',
      description: json['description'] as String? ?? '',
      createdAt: json['created_at'] as String,
    );
  }
}

class Wallet {
  final int id;
  final String balance;
  final List<Transaction> transactions;
  final String income;
  final String expense;

  const Wallet({
    required this.id,
    required this.balance,
    this.transactions = const [],
    required this.income,
    required this.expense,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) {
    return Wallet(
      id: json['id'] as int,
      balance: json['balance'] as String,
      transactions: (json['transactions'] as List<dynamic>?)
              ?.map((e) => Transaction.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      income: json['income'] as String? ?? '0',
      expense: json['expense'] as String? ?? '0',
    );
  }
}

class Funds {
  final int id;
  final String balance;
  final List<Transaction> transactions;
  final String income;
  final String expense;

  const Funds({
    required this.id,
    required this.balance,
    this.transactions = const [],
    required this.income,
    required this.expense,
  });

  factory Funds.fromJson(Map<String, dynamic> json) {
    return Funds(
      id: json['id'] as int,
      balance: json['balance'] as String,
      transactions: (json['transactions'] as List<dynamic>?)
              ?.map((e) => Transaction.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      income: json['income'] as String? ?? '0',
      expense: json['expense'] as String? ?? '0',
    );
  }
}

class Points {
  final int id;
  final String balance;
  final List<Transaction> transactions;
  final String income;
  final String expense;

  const Points({
    required this.id,
    required this.balance,
    this.transactions = const [],
    required this.income,
    required this.expense,
  });

  factory Points.fromJson(Map<String, dynamic> json) {
    return Points(
      id: json['id'] as int,
      balance: json['balance'] as String,
      transactions: (json['transactions'] as List<dynamic>?)
              ?.map((e) => Transaction.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      income: json['income'] as String? ?? '0',
      expense: json['expense'] as String? ?? '0',
    );
  }
}
