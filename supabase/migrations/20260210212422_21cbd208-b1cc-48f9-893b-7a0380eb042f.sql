
-- Drop existing trigger first
DROP TRIGGER IF EXISTS set_order_number ON public.orders;

-- Replace the function with FRIS- prefix
CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
BEGIN
  year_part := to_char(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 'FRIS-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.orders
  WHERE order_number LIKE 'FRIS-' || year_part || '-%';
  
  NEW.order_number := 'FRIS-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;

-- Recreate trigger with updated condition (also fires on TEMP- values)
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '' OR NEW.order_number LIKE 'TEMP-%')
  EXECUTE FUNCTION public.generate_order_number();
