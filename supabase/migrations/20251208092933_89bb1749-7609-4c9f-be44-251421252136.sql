-- Create app_settings table for transfer fees and other settings
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read settings" ON public.app_settings
FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update settings" ON public.app_settings
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings" ON public.app_settings
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default transfer fee
INSERT INTO public.app_settings (setting_key, setting_value) VALUES ('transfer_fee', '25');

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();