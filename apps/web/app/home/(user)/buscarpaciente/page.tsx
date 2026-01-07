
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';
import { Search } from 'lucide-react';

export default function BuscarPaciente() {
  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle>Buscar Paciente</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, teléfono o ID..."
            className="pl-8"
          />
        </div>
        <Button>Buscar</Button>
      </CardContent>
    </Card>
  );
}
