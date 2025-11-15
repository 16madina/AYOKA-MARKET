import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { Link } from "react-router-dom";

const CategoryGrid = () => {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-12 px-4">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Catégories populaires</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories?.map((category) => {
            const IconComponent = Icons[category.icon as keyof typeof Icons] as any;
            return (
              <Link key={category.id} to={`/categories/${category.slug}`}>
                <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                  <div className="flex flex-col items-center text-center gap-3">
                    {IconComponent && (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <span className="font-medium">{category.name}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
