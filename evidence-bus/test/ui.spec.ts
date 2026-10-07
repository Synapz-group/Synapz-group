import {test,expect} from '@playwright/test';
import {harness,refresh} from './helpers.js';

test('built owner console: inspect provenance, approve first proof and reject promotion; reviewer remains approved-only',async({page})=>{
  const h=await harness(true);try{
    const m=h.next();await h.send(m);
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${h.url}/owner`);await page.getByLabel('Owner access credential').fill(h.ownerToken);await page.getByRole('button',{name:'Connect',exact:true}).click();
    await expect(page.getByRole('navigation')).toBeVisible();await page.getByRole('button',{name:'Needs Review',exact:true}).click();
    await expect(page.getByRole('heading',{name:m.title})).toBeVisible();await page.getByText('Normalized diff & deterministic policy',{exact:true}).click();await expect(page.getByText('first_publication_or_unpublished',{exact:false})).toBeVisible();
    await page.getByLabel('Safe reviewer note').fill('Synthetic approved demo proof.');await page.getByRole('button',{name:'Approve & publish',exact:true}).click();await expect(page.getByText('No records in this view.')).toBeVisible();
    const projection=await(await h.api('/v1/reviewer/current',h.reviewerToken)).json();expect(projection[0].eventId).toBe(m.eventId);
    const upgraded=refresh(m,h.next().emittedAt);upgraded.maturity='DEPLOYED';await h.send(upgraded);await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('button',{name:'Reject',exact:true}).click();await expect(page.getByText('No records in this view.')).toBeVisible();await page.getByRole('button',{name:'Rejected',exact:true}).click();await expect(page.getByRole('heading',{name:m.title})).toBeVisible();
    expect((await(await h.api('/v1/copilot/context',h.reviewerToken)).json()).current[0].eventId).toBe(m.eventId);
    expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});expect(await page.locator('body').innerText()).not.toContain(h.ownerToken);expect(errors).toEqual([]);
    await page.screenshot({path:'test-results/owner-review.png',fullPage:true});
    await page.getByRole('button',{name:'Disconnect'}).click();await expect(page.getByRole('button',{name:'Connect',exact:true})).toBeVisible();
  }finally{await h.close();}
});
test('built owner console: reconciliation, stale sources, temporary ignore and owner change feed',async({page})=>{
  const h=await harness(true);try{
    await h.publish();await page.goto(`${h.url}/owner`);await page.getByLabel('Owner access credential').fill(h.ownerToken);await page.getByRole('button',{name:'Connect',exact:true}).click();await expect(page.getByRole('navigation')).toBeVisible();
    await page.getByLabel('Observation array').fill('[]');await page.getByRole('button',{name:'Run reconciliation'}).click();await expect(page.getByRole('status')).toHaveText('Reconciliation finished.');
    await page.getByRole('button',{name:'Stale Sources',exact:true}).click();await expect(page.getByRole('heading',{name:'prime',exact:true})).toBeVisible();await page.getByRole('button',{name:'Ignore alerts for 24 hours'}).first().click();await expect(page.getByRole('status')).toHaveText('Evidence loaded.');
    await page.getByRole('button',{name:'Change Feed',exact:true}).click();await expect(page.getByText('Engineering change',{exact:true})).toBeVisible();expect((await h.store.statuses()).some(s=>s.ignored_until!==null)).toBeTruthy();
  }finally{await h.close();}
});
test('built owner console: archive, keep and conflict cannot bypass review; responsive mobile rendering',async({page})=>{
  const h=await harness(true);try{
    const m=h.next();await h.send(m);await page.setViewportSize({width:390,height:844});await page.goto(`${h.url}/owner`);await page.getByLabel('Owner access credential').fill(h.ownerToken);await page.getByRole('button',{name:'Connect',exact:true}).click();await page.getByRole('button',{name:'Needs Review',exact:true}).click();await page.getByRole('button',{name:'Keep existing value'}).click();await expect(page.getByText('No records in this view.')).toBeVisible();
    const n=h.next('rig');await h.send(n);await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('button',{name:'Archive',exact:true}).click();await expect(page.getByText('No records in this view.')).toBeVisible();
    const conflict=refresh(n,n.emittedAt);await h.send(conflict);await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('button',{name:'Conflicts',exact:true}).click();await expect(page.getByRole('button',{name:'Approve & publish'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Reject',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();await page.screenshot({path:'test-results/owner-mobile.png',fullPage:true});expect(await(await h.api('/v1/reviewer/current',h.reviewerToken)).json()).toEqual([]);
  }finally{await h.close();}
});
test('built console rejects reviewer credentials and keeps evidence hidden',async({page})=>{
  const h=await harness(true);try{await h.publish('prime','restricted');await page.goto(`${h.url}/owner`);await page.getByLabel('Owner access credential').fill(h.reviewerToken);await page.getByRole('button',{name:'Connect',exact:true}).click();await expect(page.getByRole('status')).toHaveText('owner_required');await expect(page.getByRole('navigation')).toBeHidden();expect(await(await h.api('/v1/reviewer/current',h.reviewerToken)).json()).toEqual([]);}finally{await h.close();}
});
