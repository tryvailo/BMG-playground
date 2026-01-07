/*
 * -------------------------------------------------------
 * Auto-Create Subscription Trigger
 * Migration: Automatically create subscription with pending status when account is created
 * 
 * This migration creates a trigger that automatically creates a subscription
 * with pending status whenever a new account is created.
 * -------------------------------------------------------
 */

-- Function to auto-create subscription for new account
CREATE OR REPLACE FUNCTION kit.auto_create_subscription_for_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  subscription_exists BOOLEAN;
BEGIN
  -- Check if subscription already exists
  SELECT EXISTS(SELECT 1 FROM public.subscriptions WHERE account_id = NEW.id) INTO subscription_exists;
  
  IF subscription_exists THEN
    RETURN NEW;
  END IF;
  
  -- Create subscription with pending status and default Starter plan
  INSERT INTO public.subscriptions (
    account_id,
    plan_id,
    plan_name,
    price,
    currency,
    billing_interval,
    payment_method,
    payment_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'starter',
    'Starter',
    99,
    'USD',
    'month',
    'manual',
    'pending',
    now(),
    now()
  );
  
  RAISE NOTICE 'Auto-created subscription with pending status for account %', NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on accounts table
DROP TRIGGER IF EXISTS auto_create_subscription_for_account ON public.accounts;
CREATE TRIGGER auto_create_subscription_for_account
  AFTER INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION kit.auto_create_subscription_for_account();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION kit.auto_create_subscription_for_account() TO authenticated, service_role;

COMMENT ON FUNCTION kit.auto_create_subscription_for_account() IS 'Automatically creates a subscription with pending status when a new account is created';

-- Create subscriptions for all existing accounts that don't have them
DO $$
DECLARE
  account_record RECORD;
BEGIN
  FOR account_record IN 
    SELECT a.id, a.email 
    FROM public.accounts a
    WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE account_id = a.id)
  LOOP
    RAISE NOTICE 'Creating subscription for existing account: % (ID: %)', account_record.email, account_record.id;
    
    INSERT INTO public.subscriptions (
      account_id,
      plan_id,
      plan_name,
      price,
      currency,
      billing_interval,
      payment_method,
      payment_status,
      created_at,
      updated_at
    )
    VALUES (
      account_record.id,
      'starter',
      'Starter',
      99,
      'USD',
      'month',
      'manual',
      'pending',
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created subscription with pending status for account %', account_record.id;
  END LOOP;
  
  RAISE NOTICE '✅ Completed: All existing accounts now have subscriptions with pending status';
END;
$$;

