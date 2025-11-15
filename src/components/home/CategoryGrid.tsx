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
    <section className="py-8 px-4">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Catégories populaires</h2>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {categories?.map((category) => {
            const IconComponent = Icons[category.icon as keyof typeof Icons] as any;
            return (
              <Link key={category.id} to={`/categories/${category.slug}`} className="flex-shrink-0 snap-start">
                <Card className="p-4 w-[140px] hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group animate-fade-in">
                  <div className="flex flex-col items-center text-center gap-2">
                    {IconComponent && (
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                        <IconComponent className="h-7 w-7 text-primary" />
                      </div>
                    )}
                    <span className="font-medium text-sm">{category.name}</span>
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
