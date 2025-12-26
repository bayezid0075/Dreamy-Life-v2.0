"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { Page } from "components/shared/Page";
import { Card, Button, Input, Select, Textarea, Upload } from "components/ui";
import axios from "utils/axios";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      sku: "",
      category: "",
      sub_categories: [],
      brand: "",
      price: "",
      discount_price: "",
      reseller_mrp_price: "",
      delivery_charge_inside_dhaka: "",
      delivery_charge_outside_dhaka: "",
      vat: "0.00",
      tags: [],
    },
  });

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubCategories(selectedCategory);
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/vendors/categories/");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await axios.get("/api/vendors/subcategories/");
      // Filter subcategories by category if API doesn't support filtering
      const allSubCats = response.data;
      const filtered = allSubCats.filter(
        (subCat) => subCat.category?.toString() === categoryId || 
                   subCat.category === parseInt(categoryId)
      );
      setSubCategories(filtered);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubCategories([]);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get("/api/vendors/brands/");
      setBrands(response.data);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const handleImageUpload = (files) => {
    if (files) {
      const fileArray = Array.isArray(files) ? files : [files];
      setProductImages((prev) => [...prev, ...fileArray]);
    }
  };

  const removeImage = (index) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    setValue("tags", newTags);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("sku", data.sku);
      if (data.category) formData.append("category", data.category);
      if (data.brand) formData.append("brand", data.brand);
      formData.append("price", data.price);
      if (data.discount_price)
        formData.append("discount_price", data.discount_price);
      if (data.reseller_mrp_price)
        formData.append("reseller_mrp_price", data.reseller_mrp_price);
      if (data.delivery_charge_inside_dhaka)
        formData.append(
          "delivery_charge_inside_dhaka",
          data.delivery_charge_inside_dhaka
        );
      if (data.delivery_charge_outside_dhaka)
        formData.append(
          "delivery_charge_outside_dhaka",
          data.delivery_charge_outside_dhaka
        );
      formData.append("vat", data.vat || "0.00");

      // Add subcategories
      if (data.sub_categories && data.sub_categories.length > 0) {
        data.sub_categories.forEach((subCatId) => {
          formData.append("sub_categories", subCatId);
        });
      }

      // Add tags as JSON
      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags));
      } else {
        formData.append("tags", JSON.stringify([]));
      }

      // Add images
      productImages.forEach((image) => {
        formData.append("images", image);
      });

      await axios.post("/api/vendors/products/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product created successfully!");
      router.push("/vendors/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product", {
        description:
          error.response?.data?.detail ||
          Object.values(error.response?.data || {})[0]?.[0] ||
          "Please check all fields and try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="New Product">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            onClick={() => router.back()}
            variant="flat"
            isIcon
            className="size-8 sm:size-9"
          >
            <ArrowLeftIcon className="size-4 sm:size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
              Create New Product
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-dark-300 sm:mt-1 sm:text-sm">
              Add a new product to your inventory
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Basic Information
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <Input
                    label="Product Title"
                    placeholder="Enter product title"
                    {...register("title", { required: "Title is required" })}
                    error={errors.title?.message}
                  />

                  <Textarea
                    label="Description"
                    placeholder="Enter product description"
                    rows={5}
                    className="sm:rows-6"
                    {...register("description", {
                      required: "Description is required",
                    })}
                    error={errors.description?.message}
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <Input
                      label="SKU"
                      placeholder="e.g., PROD-001"
                      {...register("sku", { required: "SKU is required" })}
                      error={errors.sku?.message}
                    />

                    <Input
                      label="Price (BDT)"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register("price", {
                        required: "Price is required",
                        min: { value: 0, message: "Price must be positive" },
                      })}
                      error={errors.price?.message}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <Input
                      label="Discount Price (BDT)"
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      {...register("discount_price", {
                        min: { value: 0, message: "Price must be positive" },
                      })}
                      error={errors.discount_price?.message}
                    />

                    <Input
                      label="VAT (%)"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register("vat")}
                      error={errors.vat?.message}
                    />
                  </div>
                </div>
              </Card>

              {/* Categories & Brand */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Categories & Brand
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <Select
                    label="Category"
                    data={categories.map((cat) => ({
                      label: cat.name,
                      value: cat.id.toString(),
                    }))}
                    {...register("category")}
                    onChange={(e) => {
                      setValue("category", e.target.value);
                      setSelectedCategory(e.target.value);
                    }}
                    error={errors.category?.message}
                  />

                  {subCategories.length > 0 && (
                    <Select
                      label="Sub Categories"
                      multiple
                      data={subCategories.map((subCat) => ({
                        label: subCat.name,
                        value: subCat.id.toString(),
                      }))}
                      {...register("sub_categories")}
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        );
                        setValue("sub_categories", selected);
                      }}
                      error={errors.sub_categories?.message}
                    />
                  )}

                  <Select
                    label="Brand"
                    data={brands.map((brand) => ({
                      label: brand.name,
                      value: brand.id.toString(),
                    }))}
                    {...register("brand")}
                    error={errors.brand?.message}
                  />
                </div>
              </Card>

              {/* Pricing & Delivery */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Pricing & Delivery
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <Input
                    label="Reseller MRP Price (BDT)"
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    {...register("reseller_mrp_price")}
                    error={errors.reseller_mrp_price?.message}
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <Input
                      label="Delivery Charge (Inside Dhaka)"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register("delivery_charge_inside_dhaka")}
                      error={errors.delivery_charge_inside_dhaka?.message}
                    />

                    <Input
                      label="Delivery Charge (Outside Dhaka)"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register("delivery_charge_outside_dhaka")}
                      error={errors.delivery_charge_outside_dhaka?.message}
                    />
                  </div>
                </div>
              </Card>

              {/* Tags */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Tags
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
                    <Input
                      placeholder="Add a tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addTag} variant="outlined" className="w-full sm:w-auto">
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center space-x-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-primary-600 hover:text-primary-800 dark:text-primary-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar - Images */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Product Images
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <Upload
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  >
                    {({ onClick, disabled }) => (
                      <Button
                        type="button"
                        onClick={onClick}
                        disabled={disabled}
                        variant="outlined"
                        className="w-full text-sm sm:text-base"
                      >
                        Upload Images
                      </Button>
                    )}
                  </Upload>

                  {productImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {productImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="h-32 w-full rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Actions */}
              <Card className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    type="submit"
                    color="primary"
                    className="w-full text-sm sm:text-base"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Product"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.back()}
                    variant="outlined"
                    className="w-full text-sm sm:text-base"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
}

