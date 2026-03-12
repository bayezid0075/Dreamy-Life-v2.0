type PageProps = {
  params: {
    id: string;
  };
};

export default function MyTaskPage({ params }: PageProps) {
  const { id } = params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">My Task</h1>
      <p className="text-muted-foreground">Task ID: {id}</p>
    </div>
  );
}