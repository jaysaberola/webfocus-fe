import LeftSidebar from "@/components/News/LeftSidebar";

export default function NewsSidebar({ categories, archive }: any) {
  return (
    <div className="sidebar2 p-t-80 p-b-80 p-l-20 p-l-0-md p-t-0-md">
      <LeftSidebar categories={categories} archive={archive} />
    </div>
  );
}
