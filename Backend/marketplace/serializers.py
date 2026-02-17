from rest_framework import serializers
from django.conf import settings
from .models import Job, JobImage, JobSubmission, JobSubmissionFile


class JobImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = JobImage
        fields = ["id", "image", "image_url", "url", "order"]

    def get_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url or ""


class JobSubmissionFileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = JobSubmissionFile
        fields = ["id", "file", "name", "url", "created_at"]

    def get_url(self, obj):
        if obj.file and obj.file.name:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return ""


class JobSubmissionSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    files = JobSubmissionFileSerializer(many=True, read_only=True)

    class Meta:
        model = JobSubmission
        fields = [
            "id",
            "job",
            "user",
            "user_username",
            "quantity",
            "submission_text",
            "status",
            "amount",
            "files",
            "created_at",
            "reviewed_at",
        ]
        read_only_fields = ["id", "user", "amount", "status", "created_at", "reviewed_at"]


class JobSubmissionCreateSerializer(serializers.Serializer):
    job = serializers.PrimaryKeyRelatedField(queryset=Job.objects.none())
    quantity = serializers.IntegerField(min_value=1)
    submission_text = serializers.CharField(required=False, allow_blank=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["job"].queryset = Job.objects.filter(status="approved", remaining_quantity__gt=0)


class JobListSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    images = JobImageSerializer(many=True, read_only=True)
    submissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "description",
            "work_type",
            "price",
            "total_quantity",
            "remaining_quantity",
            "total_budget",
            "reserved_amount",
            "status",
            "user",
            "user_username",
            "images",
            "submissions_count",
            "created_at",
            "updated_at",
        ]

    def get_submissions_count(self, obj):
        return getattr(obj, "_submissions_count", obj.submissions.count())


class JobDetailSerializer(JobListSerializer):
    submissions = JobSubmissionSerializer(many=True, read_only=True)

    class Meta(JobListSerializer.Meta):
        fields = JobListSerializer.Meta.fields + ["approved_by", "approved_at", "submissions"]


class JobCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        ),
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = Job
        fields = [
            "title",
            "description",
            "work_type",
            "price",
            "total_quantity",
            "images",
        ]

    def validate(self, data):
        work_type = data.get("work_type", "single")
        price = data.get("price")
        total_quantity = data.get("total_quantity", 1)
        if work_type == "single" and total_quantity != 1:
            raise serializers.ValidationError(
                {"total_quantity": "Single unit job must have quantity 1."}
            )
        if price is not None and price <= 0:
            raise serializers.ValidationError({"price": "Price must be positive."})
        if total_quantity < 1:
            raise serializers.ValidationError(
                {"total_quantity": "Quantity must be at least 1."}
            )
        return data

    def create(self, validated_data):
        images_data = validated_data.pop("images", [])
        work_type = validated_data["work_type"]
        price = validated_data["price"]
        total_quantity = validated_data["total_quantity"]
        from decimal import Decimal
        total_budget = (price * total_quantity).quantize(Decimal("0.01"))
        validated_data["total_budget"] = total_budget
        validated_data["remaining_quantity"] = total_quantity
        validated_data["reserved_amount"] = total_budget
        job = Job.objects.create(**validated_data)
        for i, img in enumerate(images_data):
            image_url = img.get("image_url") or img.get("url")
            if image_url:
                JobImage.objects.create(
                    job=job, image_url=image_url, order=img.get("order", i)
                )
        return job
