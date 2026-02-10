
-- Create storage bucket for printer client downloads
INSERT INTO storage.buckets (id, name, public)
VALUES ('printer-client', 'printer-client', true);

-- Allow public downloads
CREATE POLICY "Public can download printer client"
ON storage.objects FOR SELECT
USING (bucket_id = 'printer-client');

-- Only admins can upload
CREATE POLICY "Admins can upload printer client"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'printer-client' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update printer client"
ON storage.objects FOR UPDATE
USING (bucket_id = 'printer-client' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete printer client"
ON storage.objects FOR DELETE
USING (bucket_id = 'printer-client' AND is_admin(auth.uid()));
