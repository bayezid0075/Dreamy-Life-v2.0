class User {
  final int id;
  final String username;
  final String email;
  final String phoneNumber;
  final bool isStaff;
  final bool isSuperuser;
  final bool? isActive;
  final String? accountStatus;

  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.phoneNumber,
    required this.isStaff,
    required this.isSuperuser,
    this.isActive,
    this.accountStatus,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      username: json['username'] as String,
      email: json['email'] as String,
      phoneNumber: json['phone_number'] as String? ?? '',
      isStaff: json['is_staff'] as bool? ?? false,
      isSuperuser: json['is_superuser'] as bool? ?? false,
      isActive: json['is_active'] as bool?,
      accountStatus: json['account_status'] as String?,
    );
  }
}

class ActiveMembership {
  final String name;
  final String purchasedAt;
  final bool isActive;

  const ActiveMembership({
    required this.name,
    required this.purchasedAt,
    required this.isActive,
  });

  factory ActiveMembership.fromJson(Map<String, dynamic> json) {
    return ActiveMembership(
      name: json['name'] as String,
      purchasedAt: json['purchased_at'] as String,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

class UserInfo {
  final int id;
  final User user;
  final String ownRefercode;
  final int level;
  final String memberStatus;
  final String? profilePicture;
  final bool isVerified;
  final String? address;
  final String? nidOrBrid;
  final String? profession;
  final String? bloodGroup;
  final String? gender;
  final String? maritalStatus;
  final String? fatherName;
  final String? motherName;
  final String? workingPlace;
  final String createdAt;
  final String updatedAt;
  final ActiveMembership? activeMembership;

  const UserInfo({
    required this.id,
    required this.user,
    required this.ownRefercode,
    required this.level,
    required this.memberStatus,
    this.profilePicture,
    required this.isVerified,
    this.address,
    this.nidOrBrid,
    this.profession,
    this.bloodGroup,
    this.gender,
    this.maritalStatus,
    this.fatherName,
    this.motherName,
    this.workingPlace,
    required this.createdAt,
    required this.updatedAt,
    this.activeMembership,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as int,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      ownRefercode: json['own_refercode'] as String? ?? '',
      level: json['level'] as int? ?? 0,
      memberStatus: json['member_status'] as String? ?? 'user',
      profilePicture: json['profile_picture'] as String?,
      isVerified: json['is_verified'] as bool? ?? false,
      address: json['address'] as String?,
      nidOrBrid: json['nid_or_brid'] as String?,
      profession: json['profession'] as String?,
      bloodGroup: json['blood_group'] as String?,
      gender: json['gender'] as String?,
      maritalStatus: json['marital_status'] as String?,
      fatherName: json['father_name'] as String?,
      motherName: json['mother_name'] as String?,
      workingPlace: json['working_place'] as String?,
      createdAt: json['created_at'] as String,
      updatedAt: json['updated_at'] as String,
      activeMembership: json['active_membership'] != null
          ? ActiveMembership.fromJson(
              json['active_membership'] as Map<String, dynamic>)
          : null,
    );
  }
}

class AuthTokens {
  final String access;
  final String refresh;

  const AuthTokens({required this.access, required this.refresh});

  /// Parse from API response. Handles direct {access, refresh} or nested {data: {access, refresh}}.
  /// Uses toString() to avoid OperationError on web when JS interop returns non-String types.
  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic> data = json;
    if (json.containsKey('data') && json['data'] is Map) {
      data = json['data'] as Map<String, dynamic>;
    }
    final access = data['access'];
    final refresh = data['refresh'];
    if (access == null || refresh == null) {
      throw FormatException(
        'Login response missing access or refresh token. Keys: ${data.keys.toList()}',
      );
    }
    return AuthTokens(
      access: access.toString(),
      refresh: refresh.toString(),
    );
  }
}

class LoginCredentials {
  final String? email;
  final String? phone;
  final String password;

  const LoginCredentials({this.email, this.phone, required this.password});

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{'password': password};
    if (email != null) m['email'] = email;
    if (phone != null) m['phone'] = phone;
    return m;
  }
}

class RegisterData {
  final String username;
  final String email;
  final String phoneNumber;
  final String password;
  final String? referredBy;

  const RegisterData({
    required this.username,
    required this.email,
    required this.phoneNumber,
    required this.password,
    this.referredBy,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{
      'username': username,
      'email': email,
      'phone_number': phoneNumber,
      'password': password,
    };
    if (referredBy != null && referredBy!.isNotEmpty) m['referred_by'] = referredBy;
    return m;
  }
}
