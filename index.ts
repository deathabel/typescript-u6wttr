import { from } from 'rxjs';

function request(method, url) {
  return from(
    new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: xhr.status,
          statusText: xhr.statusText,
        });
      };
      xhr.send();
    })
  );
}

function renderGrid(data: any) {
  const gridElement = document.querySelector('.grid');
  const contentElement = gridElement.querySelector('.grid-row');
  let contentHtml = contentElement.innerHTML;
  let contentTemplate = '';
  for (let i = 0; i < data.length; i++) {
    let templateHtml = contentHtml;
    for (const col in data[i]) {
      templateHtml = templateHtml.replace(
        new RegExp(`\\{\\{${col}\\}\\}`, 'g'),
        data[i][col]
      );
    }
    contentTemplate += templateHtml;
  }
  contentElement.innerHTML = contentTemplate;
}

request(
  'get',
  'https://raw.githubusercontent.com/deathabel/typescript-u6wttr/RxjsDemo/data.json'
).subscribe(renderGrid);

function siteSearchInputChanged(event) {
  console.log(this.value);
}

(document.querySelector('#searchInput') as HTMLInputElement).addEventListener(
  'keyup',
  siteSearchInputChanged
);
