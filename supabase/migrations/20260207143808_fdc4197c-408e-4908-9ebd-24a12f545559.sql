-- Create product option groups table
CREATE TABLE public.product_option_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_selections INTEGER NOT NULL DEFAULT 0,
  max_selections INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_scope CHECK (
    (product_id IS NOT NULL AND category_id IS NULL) OR 
    (product_id IS NULL AND category_id IS NOT NULL)
  )
);

-- Create product options table
CREATE TABLE public.product_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  option_group_id UUID NOT NULL REFERENCES public.product_option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_adjustment NUMERIC NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_item_options to store selected options per order item
CREATE TABLE public.order_item_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  option_group_name TEXT NOT NULL,
  option_name TEXT NOT NULL,
  price_adjustment NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_options ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_option_groups
CREATE POLICY "Anyone can read active option groups" 
ON public.product_option_groups 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage option groups" 
ON public.product_option_groups 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS policies for product_options
CREATE POLICY "Anyone can read available options" 
ON public.product_options 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Admins can manage options" 
ON public.product_options 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS policies for order_item_options
CREATE POLICY "Admins can manage order item options" 
ON public.order_item_options 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Order item options viewable with valid order token" 
ON public.order_item_options 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_options.order_item_id
    AND o.confirmation_token IS NOT NULL
    AND o.confirmation_token = COALESCE((current_setting('request.headers'::text, true)::json->>'x-confirmation-token'), '')
    AND o.created_at > (now() - interval '7 days')
  )
);

-- Create indexes for performance
CREATE INDEX idx_option_groups_product ON public.product_option_groups(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_option_groups_category ON public.product_option_groups(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_options_group ON public.product_options(option_group_id);
CREATE INDEX idx_order_item_options_item ON public.order_item_options(order_item_id);

-- Triggers for updated_at
CREATE TRIGGER update_product_option_groups_updated_at
BEFORE UPDATE ON public.product_option_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_options_updated_at
BEFORE UPDATE ON public.product_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();