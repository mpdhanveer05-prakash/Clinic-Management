'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const addDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  specialization: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

type AddDoctorInput = z.infer<typeof addDoctorSchema>;

const specializations = [
  'General Dentist',
  'Orthodontist',
  'Endodontist',
  'Periodontist',
  'Prosthodontist',
  'Oral Surgeon',
  'Pedodontist',
  'Implantologist',
];

interface AddDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddDoctorDialog({ open, onOpenChange, onSuccess }: AddDoctorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddDoctorInput>({
    resolver: zodResolver(addDoctorSchema),
    defaultValues: {
      specialization: 'General Dentist',
    },
  });

  const onSubmit = async (data: AddDoctorInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(`Dr. ${data.name} added successfully`);
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error?.message || 'Failed to add doctor');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Doctor
          </DialogTitle>
          <DialogDescription>Add a new doctor to your clinic</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="doctorName">Full Name *</Label>
            <Input id="doctorName" placeholder="Ramesh Kumar" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Specialization</Label>
            <Select
              defaultValue="General Dentist"
              onValueChange={(val) => setValue('specialization', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="doctorPhone">Phone</Label>
              <Input id="doctorPhone" placeholder="+91 98765 43210" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctorEmail">Email</Label>
              <Input id="doctorEmail" type="email" placeholder="dr@clinic.com" {...register('email')} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-white hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Doctor'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
