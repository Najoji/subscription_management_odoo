-- Atomic financial and subscription operations.

CREATE OR REPLACE FUNCTION public.record_payment_atomic(
    p_invoice_id UUID,
    p_method VARCHAR(50),
    p_amount NUMERIC(12,2),
    p_payment_date DATE,
    p_note TEXT,
    p_received_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invoice_row public.invoices%ROWTYPE;
    payment_row public.payments%ROWTYPE;
    updated_invoice public.invoices%ROWTYPE;
    new_amount_paid NUMERIC(12,2);
    new_status VARCHAR(20);
BEGIN
    SELECT * INTO invoice_row
    FROM public.invoices
    WHERE id = p_invoice_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice with ID % not found.', p_invoice_id;
    END IF;

    IF invoice_row.status = 'Cancelled' THEN
        RAISE EXCEPTION 'Cannot record payments against a Cancelled invoice.';
    END IF;

    IF invoice_row.status = 'Paid' THEN
        RAISE EXCEPTION 'Invoice is already fully Paid.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero.';
    END IF;

    new_amount_paid := ROUND(invoice_row.amount_paid + p_amount, 2);
    IF new_amount_paid > invoice_row.total THEN
        RAISE EXCEPTION 'Payment exceeds the remaining invoice balance.';
    END IF;

    new_status := CASE WHEN new_amount_paid = invoice_row.total THEN 'Paid' ELSE 'Confirmed' END;

    INSERT INTO public.payments (
        invoice_id, method, amount, payment_date, note, received_by
    )
    VALUES (
        p_invoice_id, p_method, p_amount, p_payment_date, p_note, p_received_by
    )
    RETURNING * INTO payment_row;

    UPDATE public.invoices
    SET amount_paid = new_amount_paid, status = new_status
    WHERE id = p_invoice_id
    RETURNING * INTO updated_invoice;

    RETURN jsonb_build_object(
        'payment', to_jsonb(payment_row),
        'invoice', to_jsonb(updated_invoice),
        'remainingBalance', ROUND(updated_invoice.total - updated_invoice.amount_paid, 2),
        'isFullyPaid', new_status = 'Paid'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_billing_invoice_atomic(
    p_invoice JSONB,
    p_items JSONB,
    p_subscription_id UUID,
    p_next_billing_date DATE,
    p_close_subscription BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invoice_row public.invoices%ROWTYPE;
BEGIN
    INSERT INTO public.invoices (
        invoice_number, subscription_id, customer_id,
        period_start, period_end, issue_date, due_date, status,
        subtotal, discount_total, tax_total, total, amount_paid, discount_id
    )
    VALUES (
        p_invoice->>'invoice_number',
        (p_invoice->>'subscription_id')::UUID,
        (p_invoice->>'customer_id')::UUID,
        (p_invoice->>'period_start')::DATE,
        (p_invoice->>'period_end')::DATE,
        (p_invoice->>'issue_date')::DATE,
        (p_invoice->>'due_date')::DATE,
        COALESCE(p_invoice->>'status', 'Draft'),
        (p_invoice->>'subtotal')::NUMERIC(12,2),
        (p_invoice->>'discount_total')::NUMERIC(12,2),
        (p_invoice->>'tax_total')::NUMERIC(12,2),
        (p_invoice->>'total')::NUMERIC(12,2),
        COALESCE((p_invoice->>'amount_paid')::NUMERIC(12,2), 0.00),
        NULLIF(p_invoice->>'discount_id', '')::UUID
    )
    RETURNING * INTO invoice_row;

    INSERT INTO public.invoice_items (
        invoice_id, product_id, variant_id, description, quantity,
        unit_price, line_subtotal, tax_rate, tax_amount, line_total
    )
    SELECT
        invoice_row.id,
        item.product_id,
        item.variant_id,
        item.description,
        item.quantity,
        item.unit_price,
        item.line_subtotal,
        item.tax_rate,
        item.tax_amount,
        item.line_total
    FROM jsonb_to_recordset(COALESCE(p_items, '[]'::JSONB)) AS item(
        product_id UUID,
        variant_id UUID,
        description VARCHAR(255),
        quantity INTEGER,
        unit_price NUMERIC(12,2),
        line_subtotal NUMERIC(12,2),
        tax_rate NUMERIC(5,2),
        tax_amount NUMERIC(12,2),
        line_total NUMERIC(12,2)
    );

    UPDATE public.subscriptions
    SET
        next_billing_date = p_next_billing_date,
        status = CASE WHEN p_close_subscription THEN 'Closed' ELSE status END,
        closed_at = CASE WHEN p_close_subscription THEN NOW() ELSE closed_at END,
        updated_at = NOW()
    WHERE id = p_subscription_id;

    RETURN to_jsonb(invoice_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_subscription_atomic(
    p_subscription JSONB,
    p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    subscription_id UUID;
BEGIN
    IF COALESCE(p_subscription->>'status', 'Confirmed') <> 'Confirmed' THEN
        RAISE EXCEPTION 'Direct subscription creation only supports the Confirmed initial status.';
    END IF;

    INSERT INTO public.subscriptions (
        subscription_number, customer_id, plan_id, quotation_id,
        start_date, expiry_date, next_billing_date, payment_terms, status
    )
    VALUES (
        p_subscription->>'subscription_number',
        (p_subscription->>'customer_id')::UUID,
        (p_subscription->>'plan_id')::UUID,
        NULLIF(p_subscription->>'quotation_id', '')::UUID,
        (p_subscription->>'start_date')::DATE,
        NULLIF(p_subscription->>'expiry_date', '')::DATE,
        (p_subscription->>'next_billing_date')::DATE,
        COALESCE(p_subscription->>'payment_terms', 'Due Upon Receipt'),
        COALESCE(p_subscription->>'status', 'Confirmed')
    )
    RETURNING id INTO subscription_id;

    INSERT INTO public.subscription_items (
        subscription_id, product_id, variant_id, description, quantity, unit_price
    )
    SELECT
        subscription_id,
        item.product_id,
        item.variant_id,
        item.description,
        item.quantity,
        item.unit_price
    FROM jsonb_to_recordset(COALESCE(p_items, '[]'::JSONB)) AS item(
        product_id UUID,
        variant_id UUID,
        description VARCHAR(255),
        quantity INTEGER,
        unit_price NUMERIC(12,2)
    );

    RETURN subscription_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.convert_quotation_atomic(
    p_quotation_id UUID,
    p_subscription JSONB,
    p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    subscription_id UUID;
BEGIN
    INSERT INTO public.subscriptions (
        subscription_number, customer_id, plan_id, quotation_id,
        start_date, expiry_date, next_billing_date, payment_terms, status
    )
    VALUES (
        p_subscription->>'subscription_number',
        (p_subscription->>'customer_id')::UUID,
        (p_subscription->>'plan_id')::UUID,
        p_quotation_id,
        (p_subscription->>'start_date')::DATE,
        NULLIF(p_subscription->>'expiry_date', '')::DATE,
        (p_subscription->>'next_billing_date')::DATE,
        COALESCE(p_subscription->>'payment_terms', 'Due Upon Receipt'),
        'Confirmed'
    )
    RETURNING id INTO subscription_id;

    INSERT INTO public.subscription_items (
        subscription_id, product_id, variant_id, description, quantity, unit_price
    )
    SELECT
        subscription_id,
        item.product_id,
        item.variant_id,
        item.description,
        item.quantity,
        item.unit_price
    FROM jsonb_to_recordset(COALESCE(p_items, '[]'::JSONB)) AS item(
        product_id UUID,
        variant_id UUID,
        description VARCHAR(255),
        quantity INTEGER,
        unit_price NUMERIC(12,2)
    );

    UPDATE public.quotations
    SET status = 'Converted', converted_subscription_id = subscription_id, updated_at = NOW()
    WHERE id = p_quotation_id AND status = 'Accepted' AND converted_subscription_id IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quotation is no longer available for conversion.';
    END IF;

    RETURN subscription_id;
END;
$$;

-- Restrict profile visibility while keeping staff/admin operational screens working.
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS VARCHAR(20)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users can view permitted profiles"
    ON public.profiles FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR public.current_profile_role() IN ('admin', 'staff')
    );

REVOKE ALL ON FUNCTION public.record_payment_atomic(UUID, VARCHAR, NUMERIC, DATE, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_billing_invoice_atomic(JSONB, JSONB, UUID, DATE, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_subscription_atomic(JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.convert_quotation_atomic(UUID, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payment_atomic(UUID, VARCHAR, NUMERIC, DATE, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_billing_invoice_atomic(JSONB, JSONB, UUID, DATE, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_subscription_atomic(JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.convert_quotation_atomic(UUID, JSONB, JSONB) TO service_role;