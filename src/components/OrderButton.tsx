import { forwardRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { usePostcode } from '@/components/PostcodeChecker';

interface OrderButtonProps extends Omit<ButtonProps, 'onClick'> {
  showArrow?: boolean;
}

const OrderButton = forwardRef<HTMLButtonElement, OrderButtonProps>(
  ({ children = 'Bestel Nu', showArrow = true, ...props }, ref) => {
    const { openOrderModal } = usePostcode();

    return (
      <Button ref={ref} onClick={openOrderModal} {...props}>
        {children}
        {showArrow && <ArrowRight className="w-5 h-5" />}
      </Button>
    );
  }
);

OrderButton.displayName = 'OrderButton';

export default OrderButton;
