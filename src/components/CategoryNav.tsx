
import { Link } from 'react-router-dom';
import { featuredCategories } from '@/data/products';

export const CategoryNav = () => {
  return (
    <section className="py-6 sm:py-8">
      <div className="container">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {featuredCategories.map((category) => (
            <Link 
              key={category.id}
              to={`/category/${category.id}`}
              className="group overflow-hidden rounded-lg border border-iwanyu-border bg-white p-4 text-center shadow-subtle transition-all duration-300 hover:shadow-hover hover:-translate-y-1"
            >
              <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-iwanyu-muted">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <h3 className="text-md font-medium text-iwanyu-foreground group-hover:text-iwanyu-primary">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
