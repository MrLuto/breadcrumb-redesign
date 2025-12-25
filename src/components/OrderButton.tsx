import { forwardRef } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { usePostcode } from '@/components/PostcodeChecker';

interface OrderButtonProps extends Omit<ButtonProps, 'onClick'> {
  showArrow?: boolean;
}

const OrderButton = forwardRef<HTMLButtonElement, OrderButtonProps>(
  ({ children = 'Bestel Nu', showArrow = true, disabled, ...props }, ref) => {
    const { openOrderModal, state } = usePostcode();
    const isLoading = state.isLoading;

    return (
      <Button 
        ref={ref} 
        onClick={openOrderModal} 
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Laden...
          </>
        ) : (
          <>
            {children}
            {showArrow && <ArrowRight className="w-5 h-5" />}
          </>
        )}
      </Button>
    );
  }
);

OrderButton.displayName = 'OrderButton';

export default OrderButton;
