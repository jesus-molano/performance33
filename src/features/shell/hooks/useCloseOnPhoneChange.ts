import { useEffect } from 'react'

/**
 * Closes what is open when the window turns from phone to laptop size or back (a narrow window widened, a tablet
 * turned): the phone remote and the laptop menus are different surfaces, so neither stays up, or pops up again, in the
 * other one. `close` must be stable (the useDisclosure / usePopover one is).
 */
export function useCloseOnPhoneChange(phone: boolean, close: () => void): void {
  useEffect(() => {
    close()
  }, [phone, close])
}
