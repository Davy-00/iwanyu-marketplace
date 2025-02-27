
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "Summer Deals",
    subtitle: "Up to 50% off on selected items",
    cta: "Shop Now",
    image: "/placeholder.svg",
    url: "/deals",
    color: "bg-gradient-to-r from-orange-400 to-amber-500"
  },
  {
    id: 2,
    title: "New Tech Arrivals",
    subtitle: "The latest gadgets for your lifestyle",
    cta: "Explore",
    image: "/placeholder.svg",
    url: "/category/electronics",
    color: "bg-gradient-to-r from-indigo-500 to-purple-500"
  },
  {
    id: 3,
    title: "Home Essentials",
    subtitle: "Transform your space with premium selections",
    cta: "Discover",
    image: "/placeholder.svg",
    url: "/category/home",
    color: "bg-gradient-to-r from-emerald-400 to-teal-500"
  }
];

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef<number | null>(null);

  const startSlideTimer = () => {
    stopSlideTimer();
    slideInterval.current = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
  };

  const stopSlideTimer = () => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
  };

  useEffect(() => {
    startSlideTimer();
    return () => stopSlideTimer();
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    startSlideTimer();
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    startSlideTimer();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    startSlideTimer();
  };

  return (
    <section className="relative aspect-[21/9] w-full overflow-hidden bg-iwanyu-muted sm:aspect-[3/1] md:aspect-[21/9]">
      <div className="relative h-full w-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 h-full w-full transition-all duration-700 ease-in-out ${
              index === currentSlide 
                ? 'z-10 opacity-100 translate-x-0' 
                : 'opacity-0 translate-x-full'
            }`}
          >
            <div className={`absolute inset-0 ${slide.color} opacity-80`}></div>
            <div className="relative z-10 flex h-full items-center px-6 lg:px-10">
              <div className="container mx-auto">
                <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                  <div className="text-white">
                    <h2 className="animate-fade-up mb-2 text-2xl font-bold md:text-4xl lg:text-5xl">
                      {slide.title}
                    </h2>
                    <p className="animate-fade-up animation-delay-100 mb-4 max-w-md text-sm opacity-90 md:text-base lg:text-lg">
                      {slide.subtitle}
                    </p>
                    <Button asChild className="animate-fade-up animation-delay-200 bg-white text-iwanyu-foreground hover:bg-gray-100">
                      <a href={slide.url}>{slide.cta}</a>
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="animate-fade-up animation-delay-300 max-h-32 w-auto object-contain sm:max-h-40 md:max-h-64"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/70 p-2 text-iwanyu-foreground shadow-md transition-all hover:bg-white"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/70 p-2 text-iwanyu-foreground shadow-md transition-all hover:bg-white"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              index === currentSlide 
                ? 'w-6 bg-white' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
