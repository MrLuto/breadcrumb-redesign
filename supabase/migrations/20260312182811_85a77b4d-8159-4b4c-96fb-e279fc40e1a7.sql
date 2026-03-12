CREATE OR REPLACE FUNCTION public.verify_order_token(order_id uuid, token text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id
      AND o.confirmation_token = token
      AND o.confirmation_token IS NOT NULL
      AND o.created_at > (now() - interval '48 hours')
  )
$$;