import { Global, Module } from '@nestjs/common';
import { ClientProvider } from './client.provider';
import { ConsulModule } from '@app/common/src';

@Global() // Make ClientProvider available everywhere
@Module({
    imports: [ConsulModule],
    providers: [ClientProvider],
    exports: [ClientProvider],
})
export class ClientModule {}