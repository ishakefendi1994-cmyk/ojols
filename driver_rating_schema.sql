-- 1. Add Rating Columns to Profiles Table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rating_avg numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings integer DEFAULT 0;

-- 2. Create Driver Ratings Table
CREATE TABLE IF NOT EXISTS public.driver_ratings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    driver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS on driver_ratings
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for driver_ratings
CREATE POLICY "Users can create ratings for their own orders" 
ON public.driver_ratings 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Anyone can read ratings" 
ON public.driver_ratings 
FOR SELECT 
TO public 
USING (true);

-- 5. Create Function to Recalculate Driver Rating
CREATE OR REPLACE FUNCTION public.update_driver_rating_avg()
RETURNS trigger AS $$
BEGIN
    -- Update the driver's profile with the new average and count
    UPDATE public.profiles
    SET 
        rating_avg = (
            SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
            FROM public.driver_ratings
            WHERE driver_id = NEW.driver_id
        ),
        total_ratings = (
            SELECT COUNT(id)
            FROM public.driver_ratings
            WHERE driver_id = NEW.driver_id
        )
    WHERE id = NEW.driver_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create Trigger to call the function
DROP TRIGGER IF EXISTS on_rating_added ON public.driver_ratings;
CREATE TRIGGER on_rating_added
AFTER INSERT OR UPDATE ON public.driver_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_driver_rating_avg();
