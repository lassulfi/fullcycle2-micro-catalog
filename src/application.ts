import {BootMixin} from '@loopback/boot';
import {Application, ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestComponent, RestServer} from '@loopback/rest';
import {RestExplorerBindings} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {EntityComponent, RestExplorerComponent, ValidatorsComponent} from './components';
import {Category} from './models';
import {MySequence} from './sequence';
import {RabbitmqServer} from './servers';
import {ValidatorService} from './services/validator.service';
// import {CrudRestComponent} from '@loopback/rest-crud';

export {ApplicationConfig};

export class MicroCatalogApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(Application)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    options.rest.sequence = MySequence;
    this.component(RestComponent);
    const restServer = this.getSync<RestServer>('servers.RestServer');
    restServer.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);
    this.component(ValidatorsComponent);
    this.component(EntityComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    this.server(RabbitmqServer);
    // this.component(CrudRestComponent);
  }

  async boot() {
    await super.boot();

    const categoryRepo = this.getSync('repositories.CategoryRepository');

    // @ts-ignore
    const category = await categoryRepo.find({where: {id: '1-cat'}});

    // @ts-ignore
    categoryRepo.updateById(category[0].id, {
      ...category[0],
      name: 'Funcionando no loopback'
    });

    // const validator = this.getSync<ValidatorService>('services.ValidatorService');
    // try {
    //   validator.validate({
    //     data: {
    //       id: '12'
    //     },
    //     entityClass: Category
    //   });
    // } catch (error) {
    //   console.dir(error, {depth: 8});
    // }
  }
}
