import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './pages/main/main.component';
import { NgModule } from '@angular/core'
export const routes: Routes = [
  {
    path: '',
    component: MainComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {}
