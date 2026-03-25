'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Camera,
  Loader2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  Copy,
  Crown,
  User as UserIcon,
  Shield,
  Briefcase,
  Home as HomeIcon,
  BadgeCheck,
  Edit,
  Save,
  X as XIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { useAuthStore } from '@/store';
import { usersApi } from '@/lib/api';
import { profileSchema, type ProfileFormData } from '@/lib/validations';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other'];
const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.profile_picture || null
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      address: user?.address || '',
      nid_or_brid: user?.nid_or_brid || '',
      profession: user?.profession || '',
      blood_group: user?.blood_group || '',
      gender: user?.gender || '',
      marital_status: user?.marital_status || '',
      father_name: user?.father_name || '',
      mother_name: user?.mother_name || '',
      working_place: user?.working_place || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: usersApi.updateUserInfo,
    onSuccess: (data) => {
      updateUser(data);
      queryClient.invalidateQueries({ queryKey: ['userinfo'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    const payload = {
      ...data,
      profile_picture: profileImage || undefined,
    };
    updateMutation.mutate(payload);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (updateMutation.isPending) {
        toast.error('Please wait, profile update is in progress');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const nextImage = reader.result as string;
        const previousImage = profileImage;

        // Optimistic preview so users see the selected image instantly.
        setProfileImage(nextImage);
        updateMutation.mutate(
          { profile_picture: nextImage },
          {
            onError: () => {
              setProfileImage(previousImage);
            },
          }
        );
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const copyReferralCode = async () => {
    if (user?.own_refercode) {
      await navigator.clipboard.writeText(user.own_refercode);
      setCopiedCode(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const memberStatusColors = {
    user: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Basic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Standard: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    Smart: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    VVIP: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0',
  };

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 md:px-0 md:py-0 space-y-4 sm:space-y-5 md:space-y-6 pb-4 md:pb-0">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800/50 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5">
            Manage your personal information
          </p>
        </div>
      </div>

      {/* Profile Overview Card - Vibrant Gradient */}
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 opacity-90" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />

        <CardContent className="relative p-4 sm:p-6 md:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 ring-4 ring-white/50 shadow-xl">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                  {user?.user.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 cursor-pointer">
                <div className="h-8 w-8 sm:h-9 sm:w-9 bg-white text-violet-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <Camera className="h-4 w-4" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                {user?.user.username}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                <Badge className={(memberStatusColors as any)[user?.member_status || 'user']}>
                  <Crown className="h-3 w-3 mr-1" />
                  {user?.member_status || 'User'}
                </Badge>
                <Badge
                  className={
                    user?.is_verified
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  }
                >
                  {user?.is_verified ? (
                    <BadgeCheck className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {user?.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="h-4 w-4 opacity-70" />
                  <span className="truncate">{user?.user.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Phone className="h-4 w-4 opacity-70" />
                  <span>{user?.user.phone_number}</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                <span className="text-xs opacity-70">Referral Code:</span>
                <code className="font-mono font-bold text-sm sm:text-base">
                  {user?.own_refercode}
                </code>
                <button
                  onClick={copyReferralCode}
                  className="hover:scale-110 transition-transform"
                >
                  {copiedCode ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info Accordion */}
      <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

        <Accordion type="single" collapsible defaultValue="personal-info" className="w-full">
          <AccordionItem value="personal-info" className="border-0">
            <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden">
                    <CardTitle className="text-sm sm:text-base md:text-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 bg-clip-text text-transparent flex items-center gap-2">
                      <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                      Personal Info
                    </CardTitle>
                  </AccordionTrigger>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1">
                    Your complete personal information
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="ml-2 h-8 w-8 sm:h-9 sm:w-9 p-0"
                >
                  {isEditing ? (
                    <XIcon className="h-4 w-4 text-rose-500" />
                  ) : (
                    <Edit className="h-4 w-4 text-violet-500" />
                  )}
                </Button>
              </div>
            </CardHeader>

            <AccordionContent>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                {!isEditing ? (
                  // View Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Father's Name</p>
                        <p className="text-sm sm:text-base font-medium">
                          {user?.father_name || 'Not provided'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Mother's Name</p>
                        <p className="text-sm sm:text-base font-medium">
                          {user?.mother_name || 'Not provided'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Gender</p>
                        <p className="text-sm sm:text-base font-medium">
                          {user?.gender || 'Not provided'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Marital Status</p>
                        <p className="text-sm sm:text-base font-medium">
                          {user?.marital_status || 'Not provided'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Blood Group</p>
                        <p className="text-sm sm:text-base font-medium">
                          {user?.blood_group || 'Not provided'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">NID / Birth Registration</p>
                        <p className="text-sm sm:text-base font-medium">
                          {user?.nid_or_brid || 'Not provided'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Profession</p>
                        <p className="text-sm sm:text-base font-medium">
                          {user?.profession || 'Not provided'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Working Place</p>
                        <p className="text-sm sm:text-base font-medium">
                          {user?.working_place || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Address</p>
                      <p className="text-sm sm:text-base font-medium">
                        {user?.address || 'Not provided'}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="father_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Father's Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter father's name" {...field} className="h-9 sm:h-10 text-sm" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="mother_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Mother's Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter mother's name" {...field} className="h-9 sm:h-10 text-sm" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {genders.map((gender) => (
                                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="marital_status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Marital Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {maritalStatuses.map((status) => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="blood_group"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Blood Group</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                                    <SelectValue placeholder="Select blood group" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bloodGroups.map((group) => (
                                    <SelectItem key={group} value={group}>{group}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="nid_or_brid"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">NID / Birth Registration</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter NID or Birth Registration" {...field} className="h-9 sm:h-10 text-sm" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="profession"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Profession</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Software Engineer" {...field} className="h-9 sm:h-10 text-sm" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="working_place"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Working Place</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., ABC Company" {...field} className="h-9 sm:h-10 text-sm" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Full Address</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your complete address"
                                className="resize-none text-sm"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={updateMutation.isPending}
                          className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white h-9 sm:h-10"
                        >
                          {updateMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="h-9 sm:h-10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}
