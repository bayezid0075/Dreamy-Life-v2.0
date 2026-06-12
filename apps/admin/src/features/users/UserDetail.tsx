export default function UserDetail({ userId }: { userId: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-on-surface mb-6">User Details</h1>
      <p className="text-on-surface-variant">User ID: {userId}</p>
      <p className="text-on-surface-variant mt-2">Detailed user view coming soon...</p>
    </div>
  );
}
