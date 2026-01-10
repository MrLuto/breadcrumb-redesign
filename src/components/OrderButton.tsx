import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';

interface OrderButtonProps extends Omit<ButtonProps, 'onClick'> {
  showArrow?: boolean;
}

const OrderButton = forwardRef<HTMLButtonElement, OrderButtonProps>(
  ({ children = 'Bestel Nu', showArrow = true, className, ...props }, ref) => {
    return (
      <Button 
        ref={ref} 
        asChild
        className={className}
        {...props}
      >
        <Link to="/assortiment">
          {children}
          {showArrow && <ArrowRight className="w-5 h-5" />}
        </Link>
      </Button>
    );
  }
);

OrderButton.displayName = 'OrderButton';

export default OrderButton;
